import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { Button } from '../../components/Button';
import { CheckCircle, AlertCircle, UploadCloud, Copy, X } from 'lucide-react';
import api from '../../services/api';

export const FileComplaint = () => {
  const [form, setForm] = useState({
    subject: '',
    description: '',
    complainant_name: '',
    complainant_email: '',
    complainant_phone: '',
  });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null); // { success, tracking_token, message }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setFileError('Only PDF, JPG, PNG, GIF, and MP4 files are allowed.');
      setFile(null);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setFileError('File size must be less than 10MB.');
      setFile(null);
      return;
    }

    setFileError('');
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const payload = {
        subject: form.subject,
        description: form.description,
        complainant_name: form.complainant_name,
        complainant_email: form.complainant_email,
        complainant_phone: form.complainant_phone || undefined,
      };

      const { data } = await api.post('/complaints', payload);

      setResult({
        success: true,
        tracking_token: data.tracking_token,
        message: 'Complaint filed successfully. Your complaint has been encrypted and logged.',
      });

      // Reset form
      setForm({
        subject: '',
        description: '',
        complainant_name: '',
        complainant_email: '',
        complainant_phone: '',
      });
      setFile(null);
    } catch (err) {
      const details = err.response?.data?.details;
      const msg = details ? details.map((e) => `${e.field}: ${e.message}`).join(' | ') : err.response?.data?.error || 'Failed to submit complaint.';
      console.error('Complaint submission error:', err);
      setResult({ success: false, message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(token);
    alert('Tracking token copied to clipboard!');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-brown-800">File a Complaint</h1>
        <p className="text-brown-500 mt-1">Report a grievance against a government official or process. Your complaint will be investigated promptly.</p>
      </div>

      {result && (
        <div className={`p-4 rounded-xl border text-sm font-medium ${
          result.success
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {result.success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {result.message}
          </div>
          {result.tracking_token && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-emerald-200">
              <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-1">Your Tracking Token</p>
              <div className="flex items-center gap-2">
                <code className="font-mono text-emerald-800 text-sm flex-1 break-all">{result.tracking_token}</code>
                <button
                  onClick={() => copyToken(result.tracking_token)}
                  className="p-1.5 hover:bg-emerald-100 rounded-md transition-colors text-emerald-600"
                  title="Copy token"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-emerald-600 mt-2">💾 Save this token to track your complaint status.</p>
            </div>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Complaint Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-brown-700">Subject</label>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Brief title of your complaint"
                className="w-full px-4 py-3 border border-brown-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brown-500 placeholder:text-brown-300"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-brown-700">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the issue in detail…"
                rows={4}
                className="w-full px-4 py-3 border border-brown-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brown-500 placeholder:text-brown-300 resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-brown-700">Your Name</label>
                <input
                  type="text"
                  name="complainant_name"
                  value={form.complainant_name}
                  onChange={handleChange}
                  placeholder="Full name"
                  className="w-full px-4 py-3 border border-brown-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brown-500 placeholder:text-brown-300"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-brown-700">Email Address</label>
                <input
                  type="email"
                  name="complainant_email"
                  value={form.complainant_email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-brown-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brown-500 placeholder:text-brown-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-brown-700">
                Phone Number <span className="font-normal text-brown-400">(optional)</span>
              </label>
              <input
                type="tel"
                name="complainant_phone"
                value={form.complainant_phone}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-4 py-3 border border-brown-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brown-500 placeholder:text-brown-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-brown-700">
                Attachment <span className="font-normal text-brown-400">(optional)</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.mp4"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-brown-200 rounded-xl cursor-pointer hover:border-brown-400 hover:bg-beige-50 transition-colors"
                >
                  <UploadCloud className="w-5 h-5 text-brown-400" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-brown-700">
                      {file ? file.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-brown-400 mt-1">PDF, JPG, PNG, GIF, MP4 up to 10MB</p>
                  </div>
                </label>
              </div>
              {fileError && (
                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs">
                  <AlertCircle className="w-4 h-4" />
                  {fileError}
                </div>
              )}
              {file && (
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm text-emerald-700 font-medium">{file.name}</p>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1 hover:bg-emerald-100 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-emerald-600" />
                  </button>
                </div>
              )}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              🔒 Your personal information is encrypted and stored securely. It is only accessible to authorized administrators.
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={isLoading || !!fileError}>
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Submit Complaint'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
