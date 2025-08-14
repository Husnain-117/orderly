import React, { useState, useEffect } from 'react';
import { SEO } from "@/components/SEO";
import AppLayout from "@/components/layout/AppLayout";
import { AppSidebar, shopItems } from "@/components/layout/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Camera, User, Mail, Building, Upload, Phone, MapPin } from "lucide-react";
import { api } from '@/lib/api';

// use shared shopItems from AppSidebar

interface UserProfile {
  id?: string;
  name?: string;
  email: string;
  organizationName?: string;
  phone?: string;
  address?: string;
  photo?: string;
  role?: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile>({
    email: '',
    name: '',
    organizationName: '',
    phone: '',
    address: '',
    photo: undefined
  });

  const [editProfile, setEditProfile] = useState<UserProfile>(profile);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.getProfile();
      setProfile(response.profile);
      setEditProfile(response.profile);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile');
    }
    setLoading(false);
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      let photoUrl = editProfile.photo;
      
      // Upload photo if a new one was selected
      if (photoFile) {
        const uploadResponse = await api.upload.image(photoFile);
        photoUrl = uploadResponse.url;
      }

      const response = await api.updateProfile({
        name: editProfile.name,
        organizationName: editProfile.organizationName,
        phone: editProfile.phone,
        address: editProfile.address,
        photo: photoUrl
      });

      setProfile(response.profile);
      setMessage('Profile updated successfully!');
      setIsEditOpen(false);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
    setLoading(false);
  };

  const handleCancelEdit = () => {
    setEditProfile(profile);
    setIsEditOpen(false);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading && !profile.email) {
    return (
      <AppLayout>
        <AppSidebar items={shopItems} />
        <main className="w-full max-w-4xl mx-auto px-6 py-4">
          <div className="text-center py-8">Loading profile...</div>
        </main>
      </AppLayout>
    );
  }

  return (
    <>
      <SEO title="Profile • Orderly" description="Manage your profile and account settings." />
      <AppLayout>
        <AppSidebar items={shopItems} />
        <main className="w-full max-w-4xl mx-auto px-6 py-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Profile</h1>
            <p className="text-slate-600">Manage your account settings and personal information</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {message}
            </div>
          )}

          {/* Profile Card */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-slate-800">Account Information</CardTitle>
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={loading}
                      className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {loading ? 'Saving...' : 'Edit Profile'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-slate-800">Edit Profile</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Photo Upload */}
                      <div className="flex flex-col items-center gap-4">
                        <Avatar className="w-20 h-20">
                          <AvatarImage src={photoPreview || profile.photo} />
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-semibold">
                            {getInitials(editProfile.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Label htmlFor="photo-upload" className="cursor-pointer">
                            <div className="flex items-center gap-2 px-3 py-2 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-all duration-200 text-emerald-600">
                              <Camera className="w-4 h-4" />
                              <span className="text-sm font-medium">Upload Photo</span>
                            </div>
                          </Label>
                          <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="name" className="text-slate-700">Name</Label>
                          <Input
                            id="name"
                            value={editProfile.name || ''}
                            onChange={(e) => setEditProfile({...editProfile, name: e.target.value})}
                            className="mt-1 border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-slate-700">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={editProfile.email}
                            disabled
                            className="mt-1 border-slate-200 bg-slate-50 text-slate-500"
                          />
                        </div>
                        <div>
                          <Label htmlFor="organizationName" className="text-slate-700">Organization</Label>
                          <Input
                            id="organizationName"
                            value={editProfile.organizationName || ''}
                            onChange={(e) => setEditProfile({...editProfile, organizationName: e.target.value})}
                            className="mt-1 border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-slate-700">Phone</Label>
                          <Input
                            id="phone"
                            value={editProfile.phone || ''}
                            onChange={(e) => setEditProfile({...editProfile, phone: e.target.value})}
                            className="mt-1 border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                          />
                        </div>
                        <div>
                          <Label htmlFor="address" className="text-slate-700">Address</Label>
                          <Input
                            id="address"
                            value={editProfile.address || ''}
                            onChange={(e) => setEditProfile({...editProfile, address: e.target.value})}
                            className="mt-1 border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                          />
                        </div>
                      </div>

                      {/* Dialog Actions */}
                      <div className="flex justify-end gap-2 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={handleCancelEdit}
                          className="border-slate-200 hover:bg-slate-50 transition-all duration-200"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSaveProfile}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/20 transition-all duration-200"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Photo and Basic Info */}
              <div className="flex items-start gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.photo} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-semibold">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-4">
                  {/* Name */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-emerald-600" />
                      <Label className="text-sm font-medium text-slate-700">Name</Label>
                    </div>
                    <p className="text-slate-800 font-medium">{profile.name}</p>
                  </div>

                  {/* Email */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-emerald-600" />
                      <Label className="text-sm font-medium text-slate-700">Email</Label>
                    </div>
                    <p className="text-slate-800">{profile.email}</p>
                  </div>

                  {/* Organization */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Building className="w-4 h-4 text-emerald-600" />
                      <Label className="text-sm font-medium text-slate-700">Organization</Label>
                    </div>
                    <p className="text-slate-800">{profile.organizationName || 'Not specified'}</p>
                  </div>

                  {/* Phone */}
                  {profile.phone && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="w-4 h-4 text-emerald-600" />
                        <Label className="text-sm font-medium text-slate-700">Phone</Label>
                      </div>
                      <p className="text-slate-800">{profile.phone}</p>
                    </div>
                  )}

                  {/* Address */}
                  {profile.address && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <Label className="text-sm font-medium text-slate-700">Address</Label>
                      </div>
                      <p className="text-slate-800">{profile.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info Section */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-slate-700">Account Type</Label>
                    <p className="text-slate-800 mt-1">Shop Owner</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-slate-700">Member Since</Label>
                    <p className="text-slate-800 mt-1">January 2024</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-slate-700">Total Orders</Label>
                    <p className="text-slate-800 mt-1">47</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-slate-700">Status</Label>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 mt-1">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </AppLayout>
    </>
  );
};

export default Profile;
