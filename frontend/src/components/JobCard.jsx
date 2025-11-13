import React from 'react';
import { applicationsService } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';

const JobCard = ({ job }) => {
  const { currentUser } = useAuth();
  
  const handleApply = async () => {
    try {
      await applicationsService.applyToJob(job.id, currentUser.uid, {
        resume: 'path/to/resume',
        coverLetter: 'Application message'
      });
    } catch (error) {
      console.error('Error applying:', error);
    }
  };

  return (
    <div className="job-card">
      <h2>{job.title}</h2>
      <p>{job.description}</p>
      <button onClick={handleApply}>Apply</button>
    </div>
  );
};

export default JobCard;