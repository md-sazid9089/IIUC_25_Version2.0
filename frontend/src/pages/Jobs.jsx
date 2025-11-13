/**
 * Jobs Page
 * Browse and filter job listings
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Briefcase, Filter } from 'lucide-react';
import { jobsService } from '../services/firestoreService';
import toast from 'react-hot-toast';
import SimpleHoverEffect from '../SimpleHoverEffect';
import SimpleWebEffect from '../SimpleWebEffect';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  useEffect(() => {
    // Real-time listener for jobs
    const unsubscribe = jobsService.subscribeToJobs((jobsData) => {
      setJobs(jobsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await jobsService.searchJobs(searchTerm, filters);
      setJobs(results);
    } catch (error) {
      console.error('Search error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="page-padding bg-bg-muted dark:bg-gray-900">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-heading text-4xl font-bold mb-2">Find Your Dream Job</h1>
          <p className="text-text-muted">Browse {jobs.length}+ opportunities for students and fresh graduates</p>
        </motion.div>

        {/* Search interface */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-11"
              />
            </div>

            <select name="type" value={filters.type} onChange={handleFilterChange} className="input-field">
              <option value="">All Types</option>
              <option value="Internship">Internship</option>
              <option value="Part-time">Part-time</option>
              <option value="Full-time">Full-time</option>
              <option value="Freelance">Freelance</option>
              <option value="Contract">Contract</option>
            </select>

            <select name="experienceLevel" value={filters.experienceLevel} onChange={handleFilterChange} className="input-field">
              <option value="">All Levels</option>
              <option value="Student">Student</option>
              <option value="Fresher">Fresher</option>
              <option value="Junior">Junior</option>
              <option value="Mid-level">Mid-level</option>
            </select>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
              <input
                name="location"
                type="text"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="Location..."
                className="input-field pl-11"
              />
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid gap-6">
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SimpleWebEffect webColor="#10b981">
                  <SimpleHoverEffect accentColor="#10b981">
                    <Link to={`/jobs/${job.id}`} className="card p-6 hover:shadow-lift transition-all block">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-heading text-xl font-semibold">{job.title}</h3>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              job.type === 'Internship' ? 'bg-blue-100 text-blue-700' :
                              job.type === 'Full-time' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {job.type}
                            </span>
                          </div>
                          <p className="text-text-muted mb-3">{job.company} • {job.location}</p>
                          <p className="text-sm text-text-muted line-clamp-2 mb-3">{job.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {job.requiredSkills.slice(0, 5).map((skill) => (
                              <span key={skill} className="px-2 py-1 bg-bg-muted text-xs rounded">
                                {skill}
                              </span>
                            ))}
                            {job.requiredSkills.length > 5 && (
                              <span className="px-2 py-1 text-xs text-text-muted">
                                +{job.requiredSkills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </SimpleHoverEffect>
                </SimpleWebEffect>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Filter className="mx-auto mb-4 text-text-muted" size={48} />
            <h3 className="font-heading text-xl font-semibold mb-2">No jobs found</h3>
            <p className="text-text-muted">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Jobs;
