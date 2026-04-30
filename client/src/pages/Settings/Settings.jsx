import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../utils/api';

const Settings = () => {
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingResume, setUploadingResume] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: '',
    location: '',
    skills: [],
    targetRole: '',
    currentRole: '',
    experienceLevel: '',
    targetCompanyType: '',
    customCompany: '',
    skillInput: '',
  });
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  // Fetch latest profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/user/profile');
        const userData = res.data;
        const targetCompanyType = userData.profile?.targetCompanyType || '';
        const isStandard = ['', 'Startup', 'MNC', 'FAANG', 'Government', 'General IT Company'].includes(targetCompanyType);
        setProfile({
          name: userData.name || '',
          phone: userData.profile?.phone || '',
          location: userData.profile?.location || '',
          skills: userData.profile?.skills || [],
          targetRole: userData.profile?.targetRole || '',
          currentRole: userData.profile?.currentRole || '',
          experienceLevel: userData.profile?.experienceLevel || '',
          targetCompanyType: isStandard ? (targetCompanyType === 'General IT Company' ? 'general' : targetCompanyType) : 'other',
          customCompany: isStandard ? '' : targetCompanyType,
          resumeParsed: userData.profile?.resumeParsed || null,
          resumeUrl: userData.profile?.resumeUrl || null,
          skillInput: '',
        });
      } catch (err) {
        console.error('Failed to load profile', err);
        showToast('Failed to load profile data', 'error');
      } finally {
        setLoadingData(false);
      }
    };
    fetchProfile();
  }, [showToast]);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const addSkill = () => {
    const skill = profile.skillInput.trim();
    if (skill && !profile.skills.includes(skill)) {
      setProfile({
        ...profile,
        skills: [...profile.skills, skill],
        skillInput: '',
      });
    }
  };

  const removeSkill = (skill) => {
    setProfile({
      ...profile,
      skills: profile.skills.filter((s) => s !== skill),
    });
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      let companyValue = profile.targetCompanyType;
      if (!companyValue || companyValue === 'general') {
        companyValue = 'General IT Company';
      } else if (companyValue === 'other') {
        companyValue = profile.customCompany || 'Other Company';
      }
      await api.put('/user/profile', {
        name: profile.name,
        phone: profile.phone,
        location: profile.location,
        currentRole: profile.currentRole,
        targetRole: profile.targetRole,
        experienceLevel: profile.experienceLevel,
        skills: profile.skills,
        targetCompanyType: companyValue,
      });
      // Update local storage and auth context
      const storedUser = JSON.parse(localStorage.getItem('mockmate_user'));
      const updatedUser = {
        ...storedUser,
        name: profile.name,
        profile: {
          ...storedUser.profile,
          phone: profile.phone,
          location: profile.location,
          currentRole: profile.currentRole,
          targetRole: profile.targetRole,
          experienceLevel: profile.experienceLevel,
          skills: profile.skills,
          targetCompanyType: companyValue,
        }
      };
      localStorage.setItem('mockmate_user', JSON.stringify(updatedUser));
      login(updatedUser);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Resume upload handler
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      showToast('Please upload a PDF file', 'error');
      return;
    }

    setUploadingResume(true);
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/user/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const { skills = [], experience = [], education = [], projects = [], resumeUrl } = res.data.data;
      // Merge new skills (avoid duplicates)
      const mergedSkills = [...new Set([...profile.skills, ...skills])];
      setProfile(prev => ({ 
        ...prev, 
        skills: mergedSkills,
        resumeParsed: { skills, experience, education, projects },
        resumeUrl: resumeUrl
      }));
      const message = res.data.message || 'Resume uploaded successfully!';
      showToast(message, 'success');
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.error || err.message || 'Failed to upload resume. Please try again.';
      showToast(message, 'error');
    } finally {
      setUploadingResume(false);
      e.target.value = null; // allow re-upload same file
    }
  };

  const updatePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (passwords.new.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.put('/user/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      showToast('Password changed successfully!', 'success');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to change password';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    const confirm = window.confirm('Are you sure? This action cannot be undone.');
    if (!confirm) return;
    setLoading(true);
    try {
      await api.delete('/user/account');
      logout();
      showToast('Account deleted. Redirecting to home...', 'success');
      navigate('/');
    } catch (err) {
      showToast('Failed to delete account', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] bg-clip-text text-transparent mb-2">
          Account Settings
        </h1>
        <p className="text-[#9ca3af] mb-8">Manage your profile and preferences</p>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#2d2d3d] mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-t-lg transition ${
              activeTab === 'profile'
                ? 'bg-[#13131a] text-purple-400 border-b-2 border-purple-400'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            Profile Info
          </button>
          <button
            onClick={() => setActiveTab('resume')}
            className={`px-4 py-2 rounded-t-lg transition ${
              activeTab === 'resume'
                ? 'bg-[#13131a] text-purple-400 border-b-2 border-purple-400'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            Resume
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 rounded-t-lg transition ${
              activeTab === 'password'
                ? 'bg-[#13131a] text-purple-400 border-b-2 border-purple-400'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            Change Password
          </button>
          <button
            onClick={() => setActiveTab('danger')}
            className={`px-4 py-2 rounded-t-lg transition ${
              activeTab === 'danger'
                ? 'bg-[#13131a] text-red-400 border-b-2 border-red-400'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            Danger Zone
          </button>
        </div>

        {/* Profile Info Tab */}
        {activeTab === 'profile' && (
          <div className="bg-[#13131a] border border-[#2d2d3d] rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={profile.location}
                onChange={handleProfileChange}
                className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">Current Role</label>
              <select
                name="currentRole"
                value={profile.currentRole}
                onChange={handleProfileChange}
                className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg focus:outline-none focus:border-purple-500"
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
                value={profile.targetRole}
                onChange={handleProfileChange}
                className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg focus:outline-none focus:border-purple-500"
                placeholder="Frontend Developer, Data Analyst, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">Experience Level</label>
              <select
                name="experienceLevel"
                value={profile.experienceLevel}
                onChange={handleProfileChange}
                className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="">Select</option>
                <option>0-1 year</option>
                <option>1-3 years</option>
                <option>3-5 years</option>
                <option>5+ years</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">Skills</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={profile.skillInput}
                  onChange={(e) => setProfile({ ...profile, skillInput: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  className="flex-1 px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg focus:outline-none focus:border-purple-500"
                  placeholder="Add a skill..."
                />
                <button onClick={addSkill} className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition">
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.skills.map((skill) => (
                  <span key={skill} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:text-white">×</button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">Target Company Type</label>
              <select
                name="targetCompanyType"
                value={profile.targetCompanyType === 'other' ? 'other' : (profile.targetCompanyType || 'general')}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'other') {
                    setProfile({ ...profile, targetCompanyType: 'other', customCompany: '' });
                  } else {
                    setProfile({ ...profile, targetCompanyType: val, customCompany: '' });
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
              {profile.targetCompanyType === 'other' && (
                <input
                  type="text"
                  placeholder="Enter company name (e.g., Google, Microsoft)"
                  value={profile.customCompany || ''}
                  onChange={(e) => setProfile({ ...profile, customCompany: e.target.value })}
                  className="mt-2 w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg focus:outline-none focus:border-purple-500"
                />
              )}
            </div>
            <button
              onClick={saveProfile}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-lg font-semibold disabled:opacity-70"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Resume Tab */}
        {activeTab === 'resume' && (
          <div className="bg-[#13131a] border border-[#2d2d3d] rounded-2xl p-6 space-y-5">
            {/* Current Resume Data */}
            {profile.resumeParsed && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Parsed Resume Data</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-[#9ca3af] mb-2">Extracted Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {profile.resumeParsed.skills?.map((skill, index) => (
                        <span key={index} className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                          {skill}
                        </span>
                      )) || <span className="text-[#6b7280] text-sm">No skills extracted</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[#9ca3af] mb-2">Experience</h4>
                    <div className="space-y-1">
                      {profile.resumeParsed.experience?.map((exp, index) => (
                        <div key={index} className="text-sm text-white bg-[#1c1c27] p-2 rounded">
                          {exp}
                        </div>
                      )) || <span className="text-[#6b7280] text-sm">No experience extracted</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[#9ca3af] mb-2">Education</h4>
                    <div className="space-y-1">
                      {profile.resumeParsed.education?.map((edu, index) => (
                        <div key={index} className="text-sm text-white bg-[#1c1c27] p-2 rounded">
                          {edu}
                        </div>
                      )) || <span className="text-[#6b7280] text-sm">No education extracted</span>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[#9ca3af] mb-2">Projects</h4>
                    <div className="space-y-1">
                      {profile.resumeParsed.projects?.map((project, index) => (
                        <div key={index} className="text-sm text-white bg-[#1c1c27] p-2 rounded">
                          {project}
                        </div>
                      )) || <span className="text-[#6b7280] text-sm">No projects extracted</span>}
                    </div>
                  </div>
                </div>
                {profile.resumeUrl && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-[#9ca3af] mb-2">Resume File</h4>
                    <a
                      href={`https://mock-mate-api.onrender.com${profile.resumeUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 text-sm underline"
                    >
                      View Uploaded Resume (PDF)
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-[#2d2d3d] pt-5">
              <h3 className="text-lg font-semibold text-white">Upload Updated Resume</h3>
              <p className="text-sm text-[#9ca3af]">
                Upload your latest resume (PDF) – AI will extract new skills and merge them with your existing ones.
              </p>
              <div className="border-2 border-dashed border-[#2d2d3d] rounded-lg p-6 text-center mt-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  className="hidden"
                  id="resumeUploadSettings"
                />
                <label htmlFor="resumeUploadSettings" className="cursor-pointer block">
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-[#9ca3af]">Click to upload PDF</p>
                  {uploadingResume && <p className="text-purple-400 mt-2">Parsing resume...</p>}
                </label>
              </div>
              <p className="text-xs text-[#6b7280] text-center mt-2">
                Note: Only text-based PDFs are supported. Scanned PDFs will not parse correctly.
              </p>
            </div>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="bg-[#13131a] border border-[#2d2d3d] rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">Current Password</label>
              <input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">New Password</label>
              <input
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#9ca3af] mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full px-4 py-2 bg-[#1c1c27] border border-[#2d2d3d] rounded-lg focus:outline-none focus:border-purple-500"
              />
            </div>
            <button
              onClick={updatePassword}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-lg font-semibold disabled:opacity-70"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        )}

        {/* Danger Zone */}
        {activeTab === 'danger' && (
          <div className="bg-[#13131a] border border-red-500/30 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-xl font-bold text-red-400 mb-2">Delete Account</h3>
              <p className="text-[#9ca3af] text-sm">
                Once you delete your account, all your interview data and progress will be permanently lost.
                This action cannot be undone.
              </p>
            </div>
            <button
              onClick={deleteAccount}
              disabled={loading}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition disabled:opacity-70"
            >
              {loading ? 'Deleting...' : 'Delete My Account'}
            </button>
          </div>
        )}

        {/* Current Plan Card */}
        <div className="mt-8 bg-[#13131a] border border-[#2d2d3d] rounded-2xl p-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <p className="text-[#9ca3af] text-sm">Current Plan</p>
            <p className="text-xl font-bold text-purple-400">{user?.plan || 'Free'}</p>
            <p className="text-xs text-[#6b7280]">{user?.creditsRemaining || 100} credits remaining</p>
          </div>
          <button
            onClick={() => navigate('/plans')}
            className="px-4 py-2 border border-purple-500 rounded-lg text-purple-400 hover:bg-purple-500/10 transition"
          >
            Upgrade Plan →
          </button>
        </div>

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/dashboard')} className="text-purple-400 underline">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;