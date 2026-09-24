import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db/connect';
import LandRequest from '@/lib/models/LandRequest';
import Official from '@/lib/models/Official';
import Session from '@/lib/models/Session';

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
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const official = await Official.findById(session.officialId);
    if (!official) {
      return NextResponse.json({ error: 'Official not found' }, { status: 404 });
    }

    // Check if official is a surveyor
    const designation = official.designation.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
    if (designation !== 'surveyor') {
      return NextResponse.json({ error: 'Only surveyors can upload survey data' }, { status: 403 });
    }

    const formData = await req.formData();
    const applicationId = formData.get('applicationId') as string;
    
    // GPS Coordinates
    const pointALat = formData.get('pointALat') as string;
    const pointALong = formData.get('pointALong') as string;
    const pointBLat = formData.get('pointBLat') as string;
    const pointBLong = formData.get('pointBLong') as string;
    const pointCLat = formData.get('pointCLat') as string;
    const pointCLong = formData.get('pointCLong') as string;
    const pointDLat = formData.get('pointDLat') as string;
    const pointDLong = formData.get('pointDLong') as string;
    const measuredArea = formData.get('measuredArea') as string;
    const surveyRemarks = formData.get('surveyRemarks') as string;

    // Files
    const boundaryMap = formData.get('boundaryMap') as File | null;
    const fieldPhotos = formData.getAll('fieldPhotos') as File[];

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    // Find the land request
    const landRequest = await LandRequest.findById(applicationId);
    if (!landRequest) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Upload boundary map to IPFS if provided
    let boundaryMapHash = '';
    if (boundaryMap) {
      const pinataApiKey = process.env.PINATA_API_KEY;
      const pinataSecretKey = process.env.PINATA_SECRET_KEY;

      if (!pinataApiKey || !pinataSecretKey) {
        return NextResponse.json({ error: 'IPFS configuration missing' }, { status: 500 });
      }

      const mapFormData = new FormData();
      mapFormData.append('file', boundaryMap);
      
      const pinataMetadata = JSON.stringify({
        name: `Boundary Map - ${landRequest.receiptNumber}`,
        keyvalues: {
          type: 'boundary_map',
          receiptNumber: landRequest.receiptNumber,
          uploadedBy: official._id.toString(),
        }
      });
      mapFormData.append('pinataMetadata', pinataMetadata);

      const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': pinataApiKey,
          'pinata_secret_api_key': pinataSecretKey,
        },
        body: mapFormData,
      });

      if (pinataResponse.ok) {
        const pinataData = await pinataResponse.json();
        boundaryMapHash = pinataData.IpfsHash;
      }
    }

    // Upload field photos to IPFS
    const fieldPhotoHashes: string[] = [];
    if (fieldPhotos && fieldPhotos.length > 0) {
      const pinataApiKey = process.env.PINATA_API_KEY;
      const pinataSecretKey = process.env.PINATA_SECRET_KEY;

      for (let i = 0; i < fieldPhotos.length; i++) {
        const photo = fieldPhotos[i];
        const photoFormData = new FormData();
        photoFormData.append('file', photo);
        
        const pinataMetadata = JSON.stringify({
          name: `Field Photo ${i + 1} - ${landRequest.receiptNumber}`,
          keyvalues: {
            type: 'field_photo',
            receiptNumber: landRequest.receiptNumber,
            photoNumber: i + 1,
            uploadedBy: official._id.toString(),
          }
        });
        photoFormData.append('pinataMetadata', pinataMetadata);

        const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
          method: 'POST',
          headers: {
            'pinata_api_key': pinataApiKey!,
            'pinata_secret_api_key': pinataSecretKey!,
          },
          body: photoFormData,
        });

        if (pinataResponse.ok) {
          const pinataData = await pinataResponse.json();
          fieldPhotoHashes.push(pinataData.IpfsHash);
        }
      }
    }

    // Update land request with survey data
    landRequest.surveyData = {
      pointA: { lat: parseFloat(pointALat), long: parseFloat(pointALong) },
      pointB: { lat: parseFloat(pointBLat), long: parseFloat(pointBLong) },
      pointC: { lat: parseFloat(pointCLat), long: parseFloat(pointCLong) },
      pointD: { lat: parseFloat(pointDLat), long: parseFloat(pointDLong) },
      measuredArea,
      boundaryMapHash,
      surveyDate: new Date(),
    };
    landRequest.fieldPhotos = fieldPhotoHashes;
    landRequest.surveyRemarks = surveyRemarks;

    await landRequest.save();

    return NextResponse.json({
      success: true,
      message: 'Survey data uploaded successfully',
      data: {
        boundaryMapHash,
        fieldPhotoHashes,
        surveyData: landRequest.surveyData,
      }
    });

  } catch (error) {
    console.error('Error uploading survey data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
