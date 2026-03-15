import React from 'react';
import UploadLayout from '../components/UploadLayout';

const UploadScreen = ({ sessionData, onNext, onBack }) => {
  return (
    <UploadLayout 
      sessionData={sessionData} 
      onNext={onNext} 
      onBack={onBack} 
    />
  );
};

export default UploadScreen;
