import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { UploadCloud, FileText, CheckCircle, Trash2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export const ChaUpload = () => {
  const [files, setFiles] = useState([]);
  const [shipmentId, setShipmentId] = useState('');
  const [docType, setDocType] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null); // { success, message }

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setResult({ success: false, message: 'Please select at least one file.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // Submit one API call per file
      // Since backend accepts file_url (not multipart), we simulate a URL
      const uploads = files.map((file) =>
        api.post('/cha/documents', {
          shipment_id: shipmentId,
          document_type: docType.toUpperCase().replace(/ /g, '_'),
          file_name: file.name,
          file_url: `https://storage.clearpath.gov/docs/${Date.now()}_${file.name}`,
          ...(assignedTo ? { assigned_to: assignedTo } : {}),
        })
      );

      await Promise.all(uploads);
      setResult({ success: true, message: `${files.length} document(s) submitted for review.` });
      setFiles([]);
      setShipmentId('');
      setDocType('');
      setAssignedTo('');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Upload failed.';
      setResult({ success: false, message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-blue-800">Upload Document</h1>
        <p className="text-blue-500 mt-1">Submit clearance documents for government review.</p>
      </div>

      {result && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${
          result.success
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {result.success
            ? <CheckCircle className="w-5 h-5" />
            : <AlertCircle className="w-5 h-5" />}
          {result.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-blue-700">Shipment UUID</label>
                <input
                  type="text"
                  value={shipmentId}
                  onChange={(e) => setShipmentId(e.target.value)}
                  placeholder="Paste shipment UUID"
                  className="w-full px-4 py-3 border border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-blue-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-blue-700">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-4 py-3 border border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-800"
                  required
                >
                  <option value="">Select type...</option>
                  <option value="BILL_OF_LADING">Bill of Lading</option>
                  <option value="INVOICE">Commercial Invoice</option>
                  <option value="PACKING_LIST">Packing List</option>
                  <option value="CERTIFICATE_OF_ORIGIN">Certificate of Origin</option>
                  <option value="CUSTOMS_DECLARATION">Customs Declaration</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-blue-700">
                Assign to Govt Official UUID <span className="font-normal text-blue-400">(optional)</span>
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Govt official UUID"
                className="w-full px-4 py-3 border border-blue-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-blue-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-blue-700">Upload Files</label>
              <div className="border-2 border-dashed border-blue-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors bg-slate-50/50">
                <UploadCloud className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <p className="text-sm text-blue-600 font-medium">Drag & drop files here, or click to browse</p>
                <p className="text-xs text-blue-400 mt-1">PDF, JPG, PNG up to 10MB each</p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="mt-3 text-sm text-blue-600"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-blue-700">Selected Files ({files.length})</label>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">{file.name}</p>
                          <p className="text-xs text-blue-400">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1.5 text-blue-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><UploadCloud className="w-5 h-5 mr-2" /> Upload Documents</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
