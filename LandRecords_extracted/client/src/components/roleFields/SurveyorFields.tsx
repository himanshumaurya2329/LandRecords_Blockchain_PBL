'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FaMapMarkedAlt } from 'react-icons/fa';

export interface SurveyorFieldsHandle {
  save: () => Promise<boolean>;
  getFormData: (applicationId: string) => FormData;
}

const SurveyorFields = forwardRef<SurveyorFieldsHandle, { application: any; onUpdate: any }>(
  ({ application, onUpdate }, ref) => {
  const [pointA, setPointA] = useState({ lat: '', long: '' });
  const [pointB, setPointB] = useState({ lat: '', long: '' });
  const [pointC, setPointC] = useState({ lat: '', long: '' });
  const [pointD, setPointD] = useState({ lat: '', long: '' });
  const [boundaryMapFile, setBoundaryMapFile] = useState<File | null>(null);
  const [fieldPhotos, setFieldPhotos] = useState<FileList | null>(null);
  const [measuredArea, setMeasuredArea] = useState('');
  const [surveyRemarks, setSurveyRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  // Load saved survey data from actionHistory on mount
  useEffect(() => {
    if (application?.actionHistory && application.actionHistory.length > 0) {
      // Find the most recent surveyor data entry
      const surveyorEntry = [...application.actionHistory]
        .reverse()
        .find((entry: any) => entry.data?.role === 'surveyor');
      
      if (surveyorEntry?.data) {
        const data = surveyorEntry.data;
        if (data.pointA) setPointA(typeof data.pointA === 'string' ? JSON.parse(data.pointA) : data.pointA);
        if (data.pointB) setPointB(typeof data.pointB === 'string' ? JSON.parse(data.pointB) : data.pointB);
        if (data.pointC) setPointC(typeof data.pointC === 'string' ? JSON.parse(data.pointC) : data.pointC);
        if (data.pointD) setPointD(typeof data.pointD === 'string' ? JSON.parse(data.pointD) : data.pointD);
        if (data.measuredArea) setMeasuredArea(data.measuredArea);
        if (data.surveyRemarks) setSurveyRemarks(data.surveyRemarks);
      }
    }
  }, [application?._id]);

  const handleSave = async (): Promise<boolean> => {
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('applicationId', application._id);
      formData.append('role', 'surveyor');
      
      // Add GPS coordinates
      formData.append('pointA', JSON.stringify(pointA));
      formData.append('pointB', JSON.stringify(pointB));
      formData.append('pointC', JSON.stringify(pointC));
      formData.append('pointD', JSON.stringify(pointD));
      formData.append('measuredArea', measuredArea);
      formData.append('surveyRemarks', surveyRemarks);
      
      // Add boundary map file
      if (boundaryMapFile) {
        formData.append('boundaryMap', boundaryMapFile);
      }
      
      // Add field photos
      if (fieldPhotos) {
        Array.from(fieldPhotos).forEach((photo, index) => {
          formData.append(`fieldPhoto${index}`, photo);
        });
      }

      const response = await fetch('/api/role-data/save', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        if (onUpdate) onUpdate();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Expose save function through ref
  useImperativeHandle(ref, () => ({
    save: handleSave,
    getFormData: (applicationId: string) => {
      const formData = new FormData();
      formData.append('applicationId', applicationId);
      formData.append('role', 'surveyor');
      
      // Add GPS coordinates
      formData.append('pointA', JSON.stringify(pointA));
      formData.append('pointB', JSON.stringify(pointB));
      formData.append('pointC', JSON.stringify(pointC));
      formData.append('pointD', JSON.stringify(pointD));
      formData.append('measuredArea', measuredArea);
      formData.append('surveyRemarks', surveyRemarks);
      
      // Add boundary map file
      if (boundaryMapFile) {
        formData.append('boundaryMap', boundaryMapFile);
      }
      
      // Add field photos
      if (fieldPhotos) {
        Array.from(fieldPhotos).forEach((photo, index) => {
          formData.append(`fieldPhoto${index}`, photo);
        });
      }
      
      return formData;
    },
  }));

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-orange-500/20 p-6 mb-6">
      <h2 className="text-xl font-bold text-orange-300 mb-4 flex items-center gap-2">
        <FaMapMarkedAlt />
        📍 Surveyor - Survey Data & Coordinates
      </h2>

      {/* GPS Coordinates */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-orange-200 mb-3">1. GPS Coordinates (4 Corner Points)</h3>
        
        {/* Point A */}
        <div className="mb-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <label className="text-sm text-orange-300 font-semibold mb-2 block">📍 Point A</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Latitude"
              value={pointA.lat}
              onChange={(e) => setPointA({ ...pointA, lat: e.target.value })}
              className="px-4 py-2 bg-slate-900/50 border border-orange-500/20 rounded-lg text-white"
            />
            <input
              type="text"
              placeholder="Longitude"
              value={pointA.long}
              onChange={(e) => setPointA({ ...pointA, long: e.target.value })}
              className="px-4 py-2 bg-slate-900/50 border border-orange-500/20 rounded-lg text-white"
            />
          </div>
        </div>

        {/* Point B */}
        <div className="mb-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <label className="text-sm text-orange-300 font-semibold mb-2 block">📍 Point B</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Latitude"
              value={pointB.lat}
              onChange={(e) => setPointB({ ...pointB, lat: e.target.value })}
              className="px-4 py-2 bg-slate-900/50 border border-orange-500/20 rounded-lg text-white"
            />
            <input
              type="text"
              placeholder="Longitude"
              value={pointB.long}
              onChange={(e) => setPointB({ ...pointB, long: e.target.value })}
              className="px-4 py-2 bg-slate-900/50 border border-orange-500/20 rounded-lg text-white"
            />
          </div>
        </div>

        {/* Point C */}
        <div className="mb-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <label className="text-sm text-orange-300 font-semibold mb-2 block">📍 Point C</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Latitude"
              value={pointC.lat}
              onChange={(e) => setPointC({ ...pointC, lat: e.target.value })}
              className="px-4 py-2 bg-slate-900/50 border border-orange-500/20 rounded-lg text-white"
            />
            <input
              type="text"
              placeholder="Longitude"
              value={pointC.long}
              onChange={(e) => setPointC({ ...pointC, long: e.target.value })}
              className="px-4 py-2 bg-slate-900/50 border border-orange-500/20 rounded-lg text-white"
            />
          </div>
        </div>

        {/* Point D */}
        <div className="mb-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <label className="text-sm text-orange-300 font-semibold mb-2 block">📍 Point D</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Latitude"
              value={pointD.lat}
              onChange={(e) => setPointD({ ...pointD, lat: e.target.value })}
              className="px-4 py-2 bg-slate-900/50 border border-orange-500/20 rounded-lg text-white"
            />
            <input
              type="text"
              placeholder="Longitude"
              value={pointD.long}
              onChange={(e) => setPointD({ ...pointD, long: e.target.value })}
              className="px-4 py-2 bg-slate-900/50 border border-orange-500/20 rounded-lg text-white"
            />
          </div>
        </div>

        {/* Measured Area */}
        <div className="mb-4">
          <label className="text-sm text-orange-300 font-semibold mb-2 block">📐 Measured Area</label>
          <input
            type="text"
            placeholder="e.g., 1000 sq meters"
            value={measuredArea}
            onChange={(e) => setMeasuredArea(e.target.value)}
            className="w-full px-4 py-2 bg-slate-900/50 border border-orange-500/20 rounded-lg text-white"
          />
        </div>
      </div>

      {/* Boundary Map Upload */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-orange-200 mb-3">2. Upload Boundary Map</h3>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setBoundaryMapFile(e.target.files?.[0] || null)}
          className="w-full px-4 py-3 bg-slate-900/50 border border-orange-500/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-500/20 file:text-orange-200"
        />
        {boundaryMapFile && (
          <p className="mt-2 text-sm text-green-400">✅ {boundaryMapFile.name}</p>
        )}
      </div>

      {/* Field Photos Upload */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-orange-200 mb-3">3. Upload Field Photos</h3>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFieldPhotos(e.target.files)}
          className="w-full px-4 py-3 bg-slate-900/50 border border-orange-500/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-500/20 file:text-orange-200"
        />
        {fieldPhotos && fieldPhotos.length > 0 && (
          <p className="mt-2 text-sm text-green-400">✅ {fieldPhotos.length} photo(s) selected</p>
        )}
      </div>

      {/* Survey Remarks */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-orange-200 mb-3">4. Survey Remarks</h3>
        <textarea
          value={surveyRemarks}
          onChange={(e) => setSurveyRemarks(e.target.value)}
          placeholder="Add any survey notes or observations..."
          rows={3}
          className="w-full px-4 py-3 bg-slate-900/50 border border-orange-500/20 rounded-lg text-white resize-none"
        />
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-200">
          💡 <strong>Data will be saved automatically when you click "Approve & Forward"</strong>
        </p>
      </div>
    </div>
  );
});

SurveyorFields.displayName = 'SurveyorFields';
export default SurveyorFields;

