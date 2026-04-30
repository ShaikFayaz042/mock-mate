import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [parsedSkills, setParsedSkills] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
    currentRole: '',
    targetRole: '',
    experienceLevel: '',
    skills: [],
    targetCompanyType: '',
    customCompany: '',
    skillInput: '',
    resumeFile: null,
  });

  // Prefill name from logged-in user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('mockmate_user'));
    if (user && user.name) {
      setFormData(prev => ({ ...prev, name: user.name }));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const normalizeSkill = (skill) => skill.toLowerCase().trim().replace(/[^a-z0-9#+]/g, '');
  const isDuplicateSkill = (skill, existingSkills) => {
    const normalized = normalizeSkill(skill);
    return existingSkills.some(s => normalizeSkill(s) === normalized);
  };

  const addSkill = () => {
    const skill = formData.skillInput.trim();
    if (!skill) return;
    if (isDuplicateSkill(skill, formData.skills)) {
      showToast('Skill already exists!', 'error');
      return;
    }
    setFormData({
      ...formData,
      skills: [...formData.skills, skill],
      skillInput: '',
    });
  };

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove),
    });
  };

  // Handle resume upload + parsing with preview
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      showToast('Please upload a PDF file', 'error');
      return;
    }

    setFormData({ ...formData, resumeFile: file });
    setUploading(true);
    setShowPreview(false);

    const formDataObj = new FormData();
    formDataObj.append('resume', file);

    try {
      const res = await api.post('/user/resume', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { skills = [] } = res.data.data;
      // Normalize and unique
      const uniqueSkills = [...new Set(skills.map(s => s.trim()))];
      setParsedSkills(uniqueSkills);
      setShowPreview(true);
      showToast('Resume parsed! Review extracted skills below.', 'success');
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.error || err.message || 'Failed to parse resume. You can add skills manually.';
      showToast(message, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Merge parsed skills into main skills array (avoid duplicates)
  const mergeParsedSkills = () => {
    const merged = [...formData.skills];
    parsedSkills.forEach(skill => {
      if (!isDuplicateSkill(skill, merged)) {
        merged.push(skill);
      }
    });
    setFormData(prev => ({ ...prev, skills: merged }));
    setShowPreview(false);
    setParsedSkills([]);
    showToast('Skills added from resume!', 'success');
  };

  const discardParsed = () => {
    setShowPreview(false);
    setParsedSkills([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let companyValue = formData.targetCompanyType;
      if (!companyValue || companyValue === 'general') {
        companyValue = 'General IT Company';
      } else if (companyValue === 'other') {
        companyValue = formData.customCompany || 'Other Company';
      }
      await api.put('/user/profile', {
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        currentRole: formData.currentRole,
        targetRole: formData.targetRole,
        experienceLevel: formData.experienceLevel,
        skills: formData.skills,
        targetCompanyType: companyValue,
      });

      // Update local storage and auth context
      const storedUser = JSON.parse(localStorage.getItem('mockmate_user'));
      const updatedUser = {
        ...storedUser,
        name: formData.name,
        profile: {
          ...storedUser.profile,
          phone: formData.phone,
          location: formData.location,
          currentRole: formData.currentRole,
          targetRole: formData.targetRole,
          experienceLevel: formData.experienceLevel,
          skills: formData.skills,
          targetCompanyType: companyValue,
        }
      };
      localStorage.setItem('mockmate_user', JSON.stringify(updatedUser));
      login(updatedUser); // assuming login function from useAuth updates context

      showToast('Profile saved!', 'success');
      navigate('/dashboard');
    } catch (err) {
      showToast('Failed to save profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-12 px-4">
      <div className="max-w-3xl mx-auto bg-[#13131a] border border-[#2d2d3d] rounded-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] bg-clip-text text-transparent">
            Complete Your Profile
          </h1>
          <p className="text-[#9ca3af] mt-2">AI will personalize interviews based on this info</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-[#9ca3af] mb-2">
            <span className={step >= 1 ? 'text-purple-400' : ''}>Step 1: Basic Info</span>
            <span className={step >= 2 ? 'text-purple-400' : ''}>Step 2: Professional Info</span>
            <span className={step >= 3 ? 'text-purple-400' : ''}>Step 3: Resume Upload</span>
          </div>
          <div className="h-2 bg-[#2d2d3d] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1">City / Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Mumbai, India"
                />
              </div>
              <button type="button" onClick={nextStep} className="w-full py-2 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-lg font-semibold mt-4">
                Next → Step 2
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1">Current Role</label>
                <select
                  name="currentRole"
                  value={formData.currentRole}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">Select</option>
                  <option>Student</option>
                  <option>Fresher</option>
                  <option>Working Professional</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1">Target Role</label>
                <input
                  type="text"
                  name="targetRole"
                  value={formData.targetRole}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Frontend Developer, Data Analyst, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1">Experience Level</label>
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg text-white focus:outline-none focus:border-purple-500"
                  required
                >
                  <option value="">Select</option>
                  <option>0-1 year</option>
                  <option>1-3 years</option>
                  <option>3-5 years</option>
                  <option>5+ years</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1">Skills (add tags)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="skillInput"
                    value={formData.skillInput}
                    onChange={handleChange}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg text-white focus:outline-none focus:border-purple-500"
                    placeholder="React, Python, SQL..."
                  />
                  <button type="button" onClick={addSkill} className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.skills.map((skill) => (
                    <span key={skill} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="text-purple-300 hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9ca3af] mb-1">Target Company Type</label>
                <select
                  name="targetCompanyType"
                  value={formData.targetCompanyType === 'other' ? 'other' : (formData.targetCompanyType || 'general')}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'other') {
                      setFormData({ ...formData, targetCompanyType: 'other', customCompany: '' });
                    } else {
                      setFormData({ ...formData, targetCompanyType: val, customCompany: '' });
                    }
                  }}
                  className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="general">General IT Company (no preference)</option>
                  <option value="Startup">Startup</option>
                  <option value="MNC">MNC</option>
                  <option value="FAANG">FAANG</option>
                  <option value="Government">Government</option>
                  <option value="other">Other (specify below)</option>
                </select>
                {formData.targetCompanyType === 'other' && (
                  <input
                    type="text"
                    placeholder="Enter company name (e.g., Google, Microsoft)"
                    value={formData.customCompany || ''}
                    onChange={(e) => setFormData({ ...formData, customCompany: e.target.value })}
                    className="mt-2 w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={prevStep} className="flex-1 py-2 border border-[#2d2d3d] rounded-lg hover:border-purple-500 transition">
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.currentRole) {
                      showToast('Please select your current role', 'error');
                      return;
                    }
                    if (!formData.targetRole.trim()) {
                      showToast('Please enter your target role', 'error');
                      return;
                    }
                    if (!formData.experienceLevel) {
                      showToast('Please select your experience level', 'error');
                      return;
                    }
                    if (formData.skills.length === 0) {
                      showToast('Please add at least one skill', 'error');
                      return;
                    }
                    nextStep();
                  }}
                  className="flex-1 py-2 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-lg font-semibold"
                >
                  Next → Step 3
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="border-2 border-dashed border-[#2d2d3d] rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resumeUpload"
                />
                <label htmlFor="resumeUpload" className="cursor-pointer block">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-[#9ca3af]">Drag & drop or click to upload resume (PDF)</p>
                  {formData.resumeFile && (
                    <p className="text-green-400 mt-2">✓ {formData.resumeFile.name}</p>
                  )}
                  {uploading && <p className="text-purple-400 mt-2">Parsing resume with AI...</p>}
                </label>
              </div>

              {/* Preview & Edit Box */}
              {showPreview && parsedSkills.length > 0 && (
                <div className="bg-[#1c1c27] rounded-lg p-4 border border-purple-500">
                  <h3 className="text-purple-400 font-semibold mb-2">📋 Extracted Skills</h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {parsedSkills.map((skill, idx) => (
                      <span key={idx} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p className="text-[#9ca3af] text-xs mb-3">
                    Do you want to add these skills to your profile?
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={mergeParsedSkills}
                      className="px-4 py-1 bg-green-600 rounded-lg hover:bg-green-700 text-sm"
                    >
                      Yes, Add All
                    </button>
                    <button
                      type="button"
                      onClick={discardParsed}
                      className="px-4 py-1 border border-red-500 text-red-400 rounded-lg hover:bg-red-500/10 text-sm"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              )}

              {formData.resumeFile && !showPreview && !uploading && (
                <p className="text-sm text-[#9ca3af] text-center">
                  Resume uploaded. Click "Save & Continue" to finish profile.
                </p>
              )}

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={prevStep} className="flex-1 py-2 border border-[#2d2d3d] rounded-lg hover:border-purple-500 transition">
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save & Continue'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;