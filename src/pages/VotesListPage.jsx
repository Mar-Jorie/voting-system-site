// Votes List Page - MANDATORY PATTERN
import React, { useState, useEffect } from 'react';
import { EyeIcon, ArrowDownTrayIcon, EllipsisVerticalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import CollapsibleTable from '../components/CollapsibleTable';
import SearchFilter from '../components/SearchFilter';
import SmartFloatingActionButton from '../components/SmartFloatingActionButton';
import Button from '../components/Button';
import Calendar from '../components/Calendar';
import Pagination from '../components/Pagination';
import { ProgressiveLoader, TableSkeleton } from '../components/SkeletonLoader';
import { useOptimizedData } from '../hooks/useOptimizedData';
import { toast } from 'react-hot-toast';
import apiClient from '../usecases/api';
import auditLogger from '../utils/auditLogger.js';

const VotesListPage = () => {
  // Use optimized data loading
  const {
    data: votes,
    loading,
    error,
    refresh
  } = useOptimizedData('votes', {
    limit: 100,
    sort: { created: -1 },
    enableGlobalRefresh: true,
    refreshKey: 'votes_page'
  });
  
  const [candidates, setCandidates] = useState([]);
  const [filteredVotes, setFilteredVotes] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({
    dateRange: null
  });
  
  // Selection state
  const [selectedVotes, setSelectedVotes] = useState(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    // Listen for vote updates
    const handleVotesUpdated = () => {
      refresh(); // Use refresh from optimized hook
    };
    
    window.addEventListener('votesUpdated', handleVotesUpdated);
    
    return () => {
      window.removeEventListener('votesUpdated', handleVotesUpdated);
    };
  }, [refresh]);

  useEffect(() => {
    filterVotes();
  }, [votes, searchValue, filters]);

  // Load candidates separately
  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const candidatesData = await apiClient.findObjects('candidates', {});
        setCandidates(candidatesData);
      } catch (error) {
        console.error('Error loading candidates:', error);
        toast.error('Failed to load candidates');
      }
    };
    
    loadCandidates();
  }, []);

  // Note: loadData function removed - now handled by useOptimizedData hook

  const filterVotes = () => {
    let filtered = [...votes];

    // Search filter
    if (searchValue) {
      filtered = filtered.filter(vote => {
        const searchLower = searchValue.toLowerCase();
        return (
          vote.voter_name?.toLowerCase().includes(searchLower) ||
          vote.voter_email?.toLowerCase().includes(searchLower) ||
          (vote.vote_type === 'dual_selection' ? 
            (getCandidateName(vote.male_candidate_id)?.toLowerCase().includes(searchLower) ||
             getCandidateName(vote.female_candidate_id)?.toLowerCase().includes(searchLower)) :
            getCandidateName(vote.candidate_id)?.toLowerCase().includes(searchLower)
          )
        );
      });
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
      filtered = filtered.filter(vote => {
        const voteDate = new Date(vote.created);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        // Set time to start/end of day for proper comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        
        return voteDate >= startDate && voteDate <= endDate;
      });
    }

    setFilteredVotes(filtered);
    // Reset pagination when filtering
    setCurrentPage(1);
  };

  const getCandidateName = (candidateId) => {
    const candidate = candidates.find(c => c.id === candidateId);
    return candidate ? candidate.name : 'Unknown';
  };

  const getCandidateCategory = (candidateId) => {
    const candidate = candidates.find(c => c.id === candidateId);
    return candidate ? candidate.category : 'unknown';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatVoteId = (vote, index) => {
    // Always create a formatted ID based on the vote's created date
    let date;
    
    // Try to get date from created field
    if (vote.created) {
      date = new Date(vote.created);
    }
    // Fallback to current date
    else {
      date = new Date();
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // If date is invalid, use current date
      date = new Date();
    }
    
    // Format the date
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    // For sequence number, use the vote's position in the original votes array
    // Find the actual index of this vote in the original votes array
    const actualIndex = votes.findIndex(v => v.id === vote.id);
    const sequence = String((actualIndex >= 0 ? actualIndex : index) + 1).padStart(3, '0');
    
    const formattedId = `${sequence}-${month}${day}${year}`;
    
    return formattedId;
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
      const csvData = filteredVotes.map((vote, index) => {
        if (vote.vote_type === 'dual_selection') {
          return {
            'Vote ID': formatVoteId(vote, index),
            'Voter Name': vote.voter_name || 'N/A',
            'Voter Email': vote.voter_email || 'N/A',
            'Male Candidate': vote.male_candidate_name || getCandidateName(vote.male_candidate_id) || 'N/A',
            'Female Candidate': vote.female_candidate_name || getCandidateName(vote.female_candidate_id) || 'N/A',
            'Vote Date': formatDate(vote.created),
            'IP Address': vote.ip_address || 'N/A'
          };
        } else {
          return {
            'Vote ID': formatVoteId(vote, index),
            'Voter Name': vote.voter_name || 'N/A',
            'Voter Email': vote.voter_email || 'N/A',
            'Candidate': vote.candidate_id ? getCandidateName(vote.candidate_id) : 'N/A',
            'Category': vote.category || 'N/A',
            'Vote Date': formatDate(vote.created),
            'IP Address': vote.ip_address || 'N/A'
          };
        }
      });

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
      toast.error('Failed to export votes');
    }
  };

  const handleViewDetails = (vote) => {
    // You can implement a modal to show detailed vote information
    toast('View vote details functionality', {
      icon: 'ℹ️',
      duration: 3000,
    });
  };

  // Selection handlers
  const handleSelectionChange = (newSelectedVotes) => {
    setSelectedVotes(newSelectedVotes);
  };

  // Bulk export handler
  const handleBulkExport = () => {
    if (selectedVotes.size === 0) return;
    setShowExportModal(true);
  };

  // CSV Export function
  const exportAsCSV = async () => {
    const votesToExport = filteredVotes.filter(vote => selectedVotes.has(vote.id));
    
    // Create CSV headers based on vote type
    const hasDualVotes = votesToExport.some(vote => vote.vote_type === 'dual_selection');
    const headers = hasDualVotes ? 
      ['Vote ID', 'Voter Name', 'Voter Email', 'Male Candidate', 'Female Candidate', 'Vote Date', 'IP Address'] :
      ['Vote ID', 'Voter Name', 'Voter Email', 'Candidate', 'Category', 'Vote Date', 'IP Address'];
    
    // Create CSV rows
    const csvRows = [
      headers.join(','),
      ...votesToExport.map((vote, index) => {
        if (vote.vote_type === 'dual_selection') {
          return [
            `"${formatVoteId(vote, index)}"`,
            `"${vote.voter_name || 'Anonymous'}"`,
            `"${vote.voter_email || 'N/A'}"`,
            `"${vote.male_candidate_name || getCandidateName(vote.male_candidate_id) || 'N/A'}"`,
            `"${vote.female_candidate_name || getCandidateName(vote.female_candidate_id) || 'N/A'}"`,
            `"${formatDate(vote.created)}"`,
            `"${vote.ip_address || 'N/A'}"`
          ].join(',');
        } else {
          return [
            `"${formatVoteId(vote, index)}"`,
            `"${vote.voter_name || 'Anonymous'}"`,
            `"${vote.voter_email || 'N/A'}"`,
            `"${vote.candidate_id ? getCandidateName(vote.candidate_id) : 'N/A'}"`,
            `"${vote.category || 'N/A'}"`,
            `"${formatDate(vote.created)}"`,
            `"${vote.ip_address || 'N/A'}"`
          ].join(',');
        }
      })
    ];
    
    const csvContent = csvRows.join('\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `votes-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
    
    // Log export action
    await auditLogger.log({
      action: 'export_data',
      entity_type: 'vote',
      entity_name: 'Votes List',
      details: {
        export_type: 'CSV',
        record_count: votesToExport.length,
        selected_votes: Array.from(selectedVotes)
      },
      category: 'export_import',
      severity: 'info'
    });
    
    toast.success(`${votesToExport.length} vote(s) exported as CSV successfully`);
  };

  // PDF Export function
  const exportAsPDF = async () => {
    const votesToExport = filteredVotes.filter(vote => selectedVotes.has(vote.id));
    
    // Close the export modal first
    setShowExportModal(false);
    
    // Create a print-specific stylesheet
    const printStyles = document.createElement('style');
    printStyles.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-content, .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        @page {
          margin: 0.5in;
          size: A4;
        }
      }
    `;
    document.head.appendChild(printStyles);
    
    // Create print content with table design
    const printElement = document.createElement('div');
    printElement.className = 'print-content';
    printElement.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: white;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">Votes Export Report</h1>
          <p style="color: #666; margin: 5px 0; font-size: 14px;">Generated: ${new Date().toLocaleDateString()}</p>
          <p style="color: #666; margin: 5px 0; font-size: 14px;">Total Votes: ${votesToExport.length}</p>
        </div>
        
        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">#</th>
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Vote ID</th>
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Voter Name</th>
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Voter Email</th>
              ${votesToExport.some(vote => vote.vote_type === 'dual_selection') ? 
                '<th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Male Candidate</th>' +
                '<th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Female Candidate</th>' :
                '<th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Candidate</th>' +
                '<th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Category</th>'
              }
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151;">Vote Date</th>
            </tr>
          </thead>
          <tbody>
            ${votesToExport.map((vote, index) => {
              if (vote.vote_type === 'dual_selection') {
                return `
                  <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px; border-right: 1px solid #e2e8f0; font-weight: 500; color: #6b7280;">${index + 1}</td>
                    <td style="padding: 12px; border-right: 1px solid #e2e8f0; font-family: monospace; font-size: 12px; color: #374151;">${formatVoteId(vote, index)}</td>
                    <td style="padding: 12px; border-right: 1px solid #e2e8f0; color: #374151;">${vote.voter_name || 'Anonymous'}</td>
                    <td style="padding: 12px; border-right: 1px solid #e2e8f0; color: #6b7280;">${vote.voter_email || 'N/A'}</td>
                    <td style="padding: 12px; border-right: 1px solid #e2e8f0; color: #374151;">${vote.male_candidate_name || getCandidateName(vote.male_candidate_id) || 'N/A'}</td>
                    <td style="padding: 12px; border-right: 1px solid #e2e8f0; color: #374151;">${vote.female_candidate_name || getCandidateName(vote.female_candidate_id) || 'N/A'}</td>
                    <td style="padding: 12px; color: #6b7280; font-size: 12px;">${formatDate(vote.created)}</td>
                  </tr>
                `;
              } else {
                return `
                  <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px; border-right: 1px solid #e2e8f0; font-weight: 500; color: #6b7280;">${index + 1}</td>
                    <td style="padding: 12px; border-right: 1px solid #e2e8f0; font-family: monospace; font-size: 12px; color: #374151;">${formatVoteId(vote, index)}</td>
                    <td style="padding: 12px; border-right: 1px solid #e2e8f0; color: #374151;">${vote.voter_name || 'Anonymous'}</td>
                    <td style="padding: 12px; border-right: 1px solid #e2e8f0; color: #6b7280;">${vote.voter_email || 'N/A'}</td>
                    <td style="padding: 12px; border-right: 1px solid #e2e8f0; color: #374151;">${vote.candidate_id ? getCandidateName(vote.candidate_id) : 'N/A'}</td>
                    <td style="padding: 12px; border-right: 1px solid #e2e8f0; color: #374151;">${vote.category || 'N/A'}</td>
                    <td style="padding: 12px; color: #6b7280; font-size: 12px;">${formatDate(vote.created)}</td>
                  </tr>
                `;
              }
            }).join('')}
          </tbody>
        </table>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b757d; font-size: 12px;">
          <p>Generated by Voting System - ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(printElement);
    
    // Trigger print
    setTimeout(() => {
      window.print();
      document.body.removeChild(printElement);
      document.head.removeChild(printStyles);
    }, 100);
    
    // Log export action
    await auditLogger.log({
      action: 'export_data',
      entity_type: 'vote',
      entity_name: 'Votes List',
      details: {
        export_type: 'PDF',
        record_count: votesToExport.length,
        selected_votes: Array.from(selectedVotes)
      },
      category: 'export_import',
      severity: 'info'
    });
    
    toast.success(`${votesToExport.length} vote(s) exported as PDF successfully`);
  };

  const columns = [
    {
      key: 'id',
      label: 'Vote ID',
      render: (value, vote, index) => {
        // Safety check for vote parameter
        if (!vote) {
          return <span className="font-mono text-sm text-gray-600">Invalid Vote</span>;
        }
        return (
          <span className="font-mono text-sm text-gray-600">
            {formatVoteId(vote, index)}
          </span>
        );
      }
    },
    {
      key: 'voter_name',
      label: 'Voter Name',
      render: (value) => (
        <span className="font-medium text-gray-900">
          {value || 'Anonymous'}
        </span>
      )
    },
    {
      key: 'voter_email',
      label: 'Email',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value || 'N/A'}
        </span>
      )
    },
    {
      key: 'created',
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
          {vote.vote_type === 'dual_selection' ? (
            // Dual selection vote - show both candidates
            <>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Male
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {vote.male_candidate_name || getCandidateName(vote.male_candidate_id)}
                </span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-pink-50">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                  Female
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {vote.female_candidate_name || getCandidateName(vote.female_candidate_id)}
                </span>
              </div>
            </>
          ) : (
            // Legacy single selection vote
            vote.candidate_id && (
              <div className={`flex items-center space-x-3 p-3 rounded-lg ${
                vote.category === 'male' ? 'bg-blue-50' : 'bg-pink-50'
              }`}>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  vote.category === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                }`}>
                  {vote.category === 'male' ? 'Male' : 'Female'}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {getCandidateName(vote.candidate_id)}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );


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
          filters={{}} // Don't pass dateRange to SearchFilter since we handle it separately
          useSelectForSearch={false}
          statusOptions={[]}
          getUniqueCompanies={() => []}
          className="bg-gray-50 border-gray-200"
        />
        
        {/* Date Range Filter */}
        <div className="mt-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
            <Calendar
              mode="range"
              value={filters.dateRange}
              onChange={(value) => handleFilterChange('dateRange', value)}
              placeholder="Select date range"
              className="w-64"
            />
            {filters.dateRange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilterChange('dateRange', null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progressive Loading with Skeleton */}
      <ProgressiveLoader
        loading={loading}
        error={error}
        onRetry={refresh}
        skeleton={TableSkeleton}
      >
        {/* Pagination Header */}
        {filteredVotes.length > 0 && (
          <div className="mb-4 flex justify-end">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredVotes.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredVotes.length}
              showInfo={true}
            />
          </div>
        )}

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          <CollapsibleTable
            data={(() => {
              // Calculate paginated data
              const startIndex = (currentPage - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              return filteredVotes.slice(startIndex, endIndex);
            })()}
            columns={columns}
            loading={loading}
            sortable={true}
            searchable={false}
            pagination={false}
            itemsPerPage={itemsPerPage}
            expandableContent={expandableContent}
            additionalActions={[
              { 
                label: 'View Details', 
                icon: 'EyeIcon', 
                variant: 'secondaryOutline',
                action: handleViewDetails
              }
            ]}
            searchPlaceholder="Search votes..."
            emptyMessage="No votes found"
            enableSelection={true}
            selectedRows={selectedVotes}
            onSelectionChange={handleSelectionChange}
          />
        </div>
      </ProgressiveLoader>

      {/* Floating Action Button */}
      <SmartFloatingActionButton 
        variant="single"
        icon="ArrowDownTrayIcon"
        label="Export votes"
        action={handleBulkExport}
        selectedCount={selectedVotes.size}
        bulkActions={[
          { name: 'Export Selected', icon: 'ArrowDownTrayIcon', action: handleBulkExport, color: 'bg-blue-600' }
        ]}
        quickActions={[
          { name: 'Export All Votes', icon: 'ArrowDownTrayIcon', action: () => {
            if (filteredVotes.length === 0) {
              toast.error('No votes to export');
              return;
            }
            setShowExportModal(true);
          }, color: 'bg-blue-600' }
        ]}
      />

      {/* Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 transition-opacity bg-black/50" onClick={() => setShowExportModal(false)}></div>
            
            {/* Modal Content */}
            <div className="relative z-50 w-full max-w-md p-6 overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Export Selected Votes</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Choose export format for {selectedVotes.size} selected vote(s):
                </p>
                <div className="space-y-3">
                  <Button
                    variant="primaryOutline"
                    size="md"
                    onClick={exportAsCSV}
                    className="w-full"
                  >
                    Export as CSV
                  </Button>
                  <Button
                    variant="secondaryOutline"
                    size="md"
                    onClick={exportAsPDF}
                    className="w-full"
                  >
                    Export as PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotesListPage;
