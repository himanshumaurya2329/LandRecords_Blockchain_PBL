import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';
import Official from '@/lib/models/Official';
import Session from '@/lib/models/Session';
import { generateTransactionId } from '@/lib/utils/transactionId';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectDB();

    // Get session and official
    const session = await Session.findOne({ 
      sessionToken,
      expiresAt: { $gt: new Date() }
    });
    
    if (!session || !session.officialId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 401 });
    }

    const official = await Official.findById(session.officialId);
    if (!official) {
      return NextResponse.json({ error: 'Official not found' }, { status: 404 });
    }

    // Parse request body - handle both JSON and FormData
    let applicationId: string;
    let roleData: any = {};
    let files: { [key: string]: File } = {};

    const contentType = req.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData
      const formData = await req.formData();
      applicationId = formData.get('applicationId') as string;
      
      // Extract all form data and files
      for (const [key, value] of formData.entries()) {
        if (key !== 'applicationId') {
          if (value instanceof File) {
            files[key] = value;
          } else {
            try {
              // Try to parse JSON strings
              roleData[key] = JSON.parse(value as string);
            } catch {
              roleData[key] = value;
            }
          }
        }
      }
    } else {
      // Handle JSON
      const jsonData = await req.json();
      applicationId = jsonData.applicationId;
      roleData = jsonData.roleData || {};
      files = jsonData.files || {};
    }

    // Track uploaded documents for documents array
    const documents: any[] = [];

    // Upload files to IPFS if any
    if (Object.keys(files).length > 0) {
      for (const [key, file] of Object.entries(files)) {
        const fileFormData = new FormData();
        fileFormData.append('file', file);

        const uploadResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PINATA_JWT}`,
          },
          body: fileFormData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          roleData[`${key}Hash`] = uploadData.IpfsHash;
          
          // Add to documents array
          const fileType = file.type.startsWith('image/') ? 'image' : 
                          file.type === 'application/pdf' ? 'pdf' : 'document';
          
          documents.push({
            fileName: file.name,
            fileType: fileType,
            ipfsHash: uploadData.IpfsHash,
            uploadedAt: new Date(),
            size: file.size,
          });
        }
      }
    }

    // Find the application
    const application = await LandRequest.findById(applicationId);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Special handling for surveyor data - update surveyData field
    if (official.designation.toLowerCase().includes('surveyor') && roleData.role === 'surveyor') {
      application.surveyData = {
        pointA: roleData.pointA,
        pointB: roleData.pointB,
        pointC: roleData.pointC,
        pointD: roleData.pointD,
        measuredArea: roleData.measuredArea,
        boundaryMapHash: roleData.boundaryMapHash,
        surveyDate: new Date(),
      };
      
      // Store field photo hashes
      const photoHashes: string[] = [];
      Object.keys(roleData).forEach(key => {
        if (key.startsWith('fieldPhotoHash') || key.startsWith('fieldPhoto') && key.endsWith('Hash')) {
          photoHashes.push(roleData[key]);
        }
      });
      if (photoHashes.length > 0) {
        application.fieldPhotos = photoHashes;
      }
      
      if (roleData.surveyRemarks) {
        application.surveyRemarks = roleData.surveyRemarks;
      }
    }

    // Add to action history
    const transactionId = generateTransactionId();
    const historyEntry = {
      transactionId,
      officialId: official._id.toString(),
      officialName: `${official.firstName} ${official.lastName}`,
      designation: official.designation,
      action: 'data_added' as const,
      remarks: `${official.designation} added verification data`,
      timestamp: new Date(),
      data: roleData,
      documents: documents.length > 0 ? documents : [],
    };

    if (!application.actionHistory) {
      application.actionHistory = [];
    }
    application.actionHistory.push(historyEntry as any);

    await application.save();

    return NextResponse.json({
      success: true,
      message: 'Data saved successfully',
      transactionId,
      historyEntry,
    });
  } catch (error) {
    console.error('Error saving role data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
