// Votes List Page - MANDATORY PATTERN
import React, { useState, useEffect } from 'react';
import { EyeIcon, ArrowDownTrayIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import CollapsibleTable from '../components/CollapsibleTable';
import SearchFilter from '../components/SearchFilter';
import SmartFloatingActionButton from '../components/SmartFloatingActionButton';
import { toast } from 'react-hot-toast';

const VotesListPage = () => {
  const [votes, setVotes] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [filteredVotes, setFilteredVotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    dateRange: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterVotes();
  }, [votes, searchValue, filters]);

  const loadData = () => {
    setLoading(true);
    try {
      const storedVotes = JSON.parse(localStorage.getItem('votes') || '[]');
      const storedCandidates = JSON.parse(localStorage.getItem('candidates') || '[]');
      
      setVotes(storedVotes);
      setCandidates(storedCandidates);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load votes data');
    } finally {
      setLoading(false);
    }
  };

  const filterVotes = () => {
    let filtered = [...votes];

    // Search filter
    if (searchValue) {
      filtered = filtered.filter(vote => 
        vote.voterName?.toLowerCase().includes(searchValue.toLowerCase()) ||
        vote.voterEmail?.toLowerCase().includes(searchValue.toLowerCase()) ||
        getCandidateName(vote.maleCandidateId)?.toLowerCase().includes(searchValue.toLowerCase()) ||
        getCandidateName(vote.femaleCandidateId)?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(vote => {
        if (filters.category === 'male') {
          return vote.maleCandidateId;
        } else if (filters.category === 'female') {
          return vote.femaleCandidateId;
        }
        return true;
      });
    }

    setFilteredVotes(filtered);
  };

  const getCandidateName = (candidateId) => {
    const candidate = candidates.find(c => c.id === candidateId);
    return candidate ? candidate.name : 'Unknown';
  };

  const getCandidateCategory = (candidateId) => {
    const candidate = candidates.find(c => c.id === candidateId);
    return candidate ? candidate.category : 'unknown';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatVoteId = (vote, index) => {
    const date = new Date(vote.timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const sequence = String(index + 1).padStart(3, '0');
    return `${sequence}-${month}${day}${year}`;
  };

  const handleSearchChange = (value) => {
    setSearchValue(value);
  };

  const handleSearch = () => {
    filterVotes();
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleExport = () => {
    try {
      const csvData = filteredVotes.map((vote, index) => ({
        'Vote ID': formatVoteId(vote, index),
        'Voter Name': vote.voterName || 'N/A',
        'Voter Email': vote.voterEmail || 'N/A',
        'Male Candidate': vote.maleCandidateId ? getCandidateName(vote.maleCandidateId) : 'N/A',
        'Female Candidate': vote.femaleCandidateId ? getCandidateName(vote.femaleCandidateId) : 'N/A',
        'Vote Date': formatDate(vote.timestamp),
        'IP Address': vote.ipAddress || 'N/A'
      }));

      const csvContent = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `votes-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Votes exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export votes');
    }
  };

  const handleViewDetails = (vote) => {
    // You can implement a modal to show detailed vote information
    console.log('View vote details:', vote);
    toast('View vote details functionality', {
      icon: 'ℹ️',
      duration: 3000,
    });
  };

  const columns = [
    {
      key: 'id',
      label: 'Vote ID',
      render: (value, vote, index) => (
        <span className="font-mono text-sm text-gray-600">
          {formatVoteId(vote, index)}
        </span>
      )
    },
    {
      key: 'voterName',
      label: 'Voter Name',
      render: (value) => (
        <span className="font-medium text-gray-900">
          {value || 'Anonymous'}
        </span>
      )
    },
    {
      key: 'voterEmail',
      label: 'Email',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'candidates',
      label: 'Voted For',
      render: (_, vote) => (
        <div className="space-y-1">
          {vote.maleCandidateId && (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Male
              </span>
              <span className="text-sm text-gray-900">
                {getCandidateName(vote.maleCandidateId)}
              </span>
            </div>
          )}
          {vote.femaleCandidateId && (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                Female
              </span>
              <span className="text-sm text-gray-900">
                {getCandidateName(vote.femaleCandidateId)}
              </span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'timestamp',
      label: 'Vote Date',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {formatDate(value)}
        </span>
      )
    }
  ];

  const expandableContent = (vote) => (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Voted For</h4>
        <div className="space-y-3">
          {vote.maleCandidateId && (
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Male
              </span>
              <span className="text-sm font-medium text-gray-900">
                {getCandidateName(vote.maleCandidateId)}
              </span>
            </div>
          )}
          {vote.femaleCandidateId && (
            <div className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                Female
              </span>
              <span className="text-sm font-medium text-gray-900">
                {getCandidateName(vote.femaleCandidateId)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'male', label: 'Male Votes' },
    { value: 'female', label: 'Female Votes' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
          Votes List
        </h1>
        <p className="text-gray-600">
          View and manage all voting records with detailed information.
        </p>
      </div>

      {/* Filters Section */}
      <div className="mb-6">
        <SearchFilter
          placeholder="Search by voter name, email, or candidate..."
          value={searchValue}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          filters={filters}
          useSelectForSearch={false}
          statusOptions={categoryOptions}
          getUniqueCompanies={() => []}
          className="bg-gray-50 border-gray-200"
        />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <CollapsibleTable
          data={filteredVotes}
          columns={columns}
          loading={loading}
          sortable={true}
          searchable={false}
          pagination={true}
          itemsPerPage={10}
          expandableContent={expandableContent}
          additionalActions={[
            { 
              label: 'View Details', 
              icon: EyeIcon, 
              variant: 'secondaryOutline',
              action: handleViewDetails
            }
          ]}
          searchPlaceholder="Search votes..."
          emptyMessage="No votes found"
          enableSelection={false}
        />
      </div>

      {/* Floating Action Button */}
      <SmartFloatingActionButton 
        variant="single"
        icon="ArrowDownTrayIcon"
        label="Export votes"
        action={handleExport}
        quickActions={[
          { name: 'Export CSV', icon: 'ArrowDownTrayIcon', action: handleExport, color: 'bg-blue-600' }
        ]}
      />
    </div>
  );
};

export default VotesListPage;
