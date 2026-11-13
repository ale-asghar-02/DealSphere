import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import { Country, City } from 'country-state-city'
import { IconEdit } from '@tabler/icons-react';

import { useAuth } from '../../auth/hooks/useAuth'
import useDashboard from '../hooks/useDashboard'

const AccountSetting = () => {
  const navigate = useNavigate();
  const { user, handleLogoutAllDevices } = useAuth();
  const { dashboardLoading, handleAccountUpdate } = useDashboard();

  const fileInputRef = useRef(null);
  const [image, setImage] = useState(user?.userImage || "");
  const [selectedFile, setSelectedFile] = useState(null);

  const [username, setUsername] = useState(user?.username || "");
  const [aboutMe, setAboutMe] = useState(user?.aboutMe || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [selectedCountry, setSelectedCountry] = useState(user?.country || "");
  const [selectedCity, setSelectedCity] = useState(user?.city || "");
  const [address, setAddress] = useState(user?.address || "");

  const countries = Country.getAllCountries();
  const cities = selectedCountry ? City.getCitiesOfCountry(selectedCountry) : [];

  const handleEditClick = () => fileInputRef.current.click();


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImage(URL.createObjectURL(file));
    }
  };

  const handlePhoneChange = (e) => {
    const onlyNums = e.target.value.replace(/\D/g, "");
    setPhoneNumber(onlyNums);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("username", username);
    formData.append("aboutMe", aboutMe);
    formData.append("gender", gender);
    formData.append("phoneNumber", phoneNumber);
    formData.append("country", selectedCountry);
    formData.append("city", selectedCity);
    formData.append("address", address);
    if (selectedFile) {
      formData.append("userImage", selectedFile);
    }

    handleAccountUpdate(formData);
  };

  return (
    <div>
      <div className='d-flex flex-wrap align-items-center mb-3'>
        <h1 className="fs-5 me-3 mb-0">Account Setting</h1>
        <span className='small text-success'>( Account type : {user?.accountType} )</span>
      </div>
      <form onSubmit={handleSubmit} encType="multipart/form-data">

        <div className="row g-2">
          <div className="col-12 col-lg-6 mb-2">
            <label className="form-label">Username</label>
            <input
              type="text" name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-control" minLength={3} maxLength={30} placeholder="Your username"
            />
          </div>
          <div className="col-12 col-lg-6 mb-2">
            <label className="form-label">Email Address</label>
            <input type="email" value={user?.email || ""} className="form-control" disabled readOnly />
          </div>

          <div className="profile-wrapper mb-3">
            {image ? (
              <div className="image-container d-flex align-items-end gap-4 position-relative">
                <img src={image} width={80} height={80} alt="profile" className="border rounded-circle object-fit-cover" />
                <div className='text-body-secondary d-flex align-items-end' style={{ cursor : 'pointer' }} onClick={handleEditClick}>
                  <p className='me-2 mb-0'>Edit Image</p>
                  <IconEdit stroke={1.5} size={22} style={{ marginBottom : '2px'}}/>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  name="userImage"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  hidden
                />
              </div>
            ) : (
              <div>
                <label className="form-label">Profile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  name="userImage"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="form-control"
                />
              </div>
            )}
          </div>

          <div className="col-12 mb-2">
            <label className="form-label d-flex justify-content-between">
              <span>About Me</span>
              <span className="text-muted">{aboutMe.length}/200</span>
            </label>
            <textarea
              className="form-control" rows="3" name="aboutMe"
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
              maxLength={200} minLength={30} placeholder="Typing... (Min : 30 & Max : 200)"
            ></textarea>
          </div>

          <div className="col-12 col-lg-6 mb-2">
            <label className="form-label">Gender</label>
            <select name="gender" className="form-select py-3" value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select your gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div className="col-12 col-lg-6 mb-2">
            <label className="form-label">Phone Number</label>
            <input
              type="tel" name="phoneNumber" inputMode="numeric"
              value={phoneNumber}
              onChange={handlePhoneChange}
              className="form-control" placeholder="Your phone number"
            />
          </div>

          <div className="col-12 col-lg-6 mb-2">
            <label className="form-label">Country</label>
            <select
              name="country"
              className="form-select py-3"
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setSelectedCity("");
              }}
            >
              <option value="">Select your country</option>
              {countries.map((c) => (
                <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="col-12 col-lg-6 mb-2">
            <label className="form-label">City</label>
            <select
              name="city"
              className="form-select py-3"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!selectedCountry}
            >
              <option value="">Select your city</option>
              {cities.map((city, i) => (
                <option key={i} value={city.name}>{city.name}</option>
              ))}
            </select>
          </div>

          <div className="col-12 mb-2">
            <label className="form-label">Address</label>
            <input
              type="text" name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="form-control" placeholder="Your address"
            />
          </div>

          <div className="col-12 d-flex flex-wrap justify-content-end gap-2 my-2">
            <button 
            type="button" 
            className="btn btn-outline-danger" 
            onClick={() => {
              handleLogoutAllDevices();
              navigate('/');
            }} 
            style={{ paddingBlock: "10px" }} disabled={ dashboardLoading }>
              Logout All Devices
            </button>
            <button type="submit" className="btn btn-primary" disabled={dashboardLoading} style={{ paddingBlock: "10px" }}>
              {dashboardLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AccountSetting;