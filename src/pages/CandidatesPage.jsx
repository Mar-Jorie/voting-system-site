// Candidates Page - MANDATORY PATTERN
import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, EyeIcon, PlusIcon, UserIcon, EllipsisVerticalIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Button from '../components/Button';
import FormModal from '../components/FormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import InputFactory from '../components/InputFactory';
import SelectInput from '../components/SelectInput';
import SmartFloatingActionButton from '../components/SmartFloatingActionButton';
import SearchFilter from '../components/SearchFilter';
import Pagination from '../components/Pagination';
import { ProgressiveLoader, CandidatesPageSkeleton } from '../components/SkeletonLoader';
import LazyImage from '../components/LazyImage';
import LoadingSpinner from '../components/LoadingSpinner';
import { useOptimizedCandidatesData } from '../hooks/useOptimizedData';
import { toast } from 'react-hot-toast';
import apiClient from '../usecases/api';
import auditLogger from '../utils/auditLogger.js';

const CandidatesPage = () => {
  // Use optimized data loading
  const {
    data: candidates,
    loading,
    error,
    refresh
  } = useOptimizedCandidatesData();
  
  // State for vote counts
  const [voteCounts, setVoteCounts] = useState({});
  
  
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [deletingCandidate, setDeletingCandidate] = useState(null);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    images: []
  });
  
  // Search and filter state
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState({});
  const [candidateImageIndex, setCandidateImageIndex] = useState({});
  
  // Individual category pagination
  const [maleCurrentPage, setMaleCurrentPage] = useState(1);
  const [femaleCurrentPage, setFemaleCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // 3 per category to show both categories on same page
  
  // Multi-select state
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  
  // Loading states for confirmation modals
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Load vote counts for candidates
  const loadVoteCounts = async () => {
    try {
      if (!candidates || candidates.length === 0) {
        setVoteCounts({});
        return;
      }
      
      // Get all votes
      const votes = await apiClient.findObjects('votes', {});
      
      // Calculate vote counts for each candidate
      const counts = {};
      candidates.forEach(candidate => {
        counts[candidate.id] = 0;
      });
      
      // Count votes for each candidate
      if (votes && votes.length > 0) {
        votes.forEach(vote => {
          // Check if vote is for a male candidate
          if (vote.male_candidate_id && counts.hasOwnProperty(vote.male_candidate_id)) {
            counts[vote.male_candidate_id]++;
          }
          // Check if vote is for a female candidate
          if (vote.female_candidate_id && counts.hasOwnProperty(vote.female_candidate_id)) {
            counts[vote.female_candidate_id]++;
          }
        });
      }
      
      setVoteCounts(counts);
    } catch (error) {
      // Error loading vote counts - handled silently
      setVoteCounts({});
    }
  };

  useEffect(() => {
    // Load vote counts when candidates change
    loadVoteCounts();
  }, [candidates]);

  useEffect(() => {
    // Listen for vote updates
    const handleVotesUpdated = () => {
      refresh(); // Use refresh from optimized hook
      loadVoteCounts(); // Reload vote counts
    };
    
    // Listen for candidate updates
    const handleCandidatesUpdated = () => {
      refresh(); // Use refresh from optimized hook
    };
    
    window.addEventListener('votesUpdated', handleVotesUpdated);
    window.addEventListener('candidatesUpdated', handleCandidatesUpdated);
    
    return () => {
      window.removeEventListener('votesUpdated', handleVotesUpdated);
      window.removeEventListener('candidatesUpdated', handleCandidatesUpdated);
    };
  }, [refresh]);

  // Filter candidates based on search and filters
  useEffect(() => {
    // Safety check: ensure candidates is an array
    if (!candidates || !Array.isArray(candidates)) {
      setFilteredCandidates([]);
      return;
    }
    
    let filtered = candidates;
    
    // Search filter
    if (searchValue) {
      filtered = filtered.filter(candidate => 
        candidate.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        candidate.description.toLowerCase().includes(searchValue.toLowerCase())
      );
    }
    
    // Category filter (status in SearchFilter maps to category in candidates)
    if (filters.status) {
      filtered = filtered.filter(candidate => candidate.category === filters.status);
    }
    
    setFilteredCandidates(filtered);
    // Reset pagination when filtering
    setMaleCurrentPage(1);
    setFemaleCurrentPage(1);
  }, [candidates, searchValue, filters]);

  // Note: loadCandidates function removed - now handled by useOptimizedCandidatesData hook

  const handleAddCandidate = () => {
    setEditingCandidate(null);
    setFormData({
      name: '',
      category: '',
      description: '',
      images: []
    });
    setShowFormModal(true);
  };

  const handleEditCandidate = (candidate) => {
    setEditingCandidate(candidate);
    const editFormData = {
      name: candidate.name,
      category: candidate.category,
      description: candidate.description,
      images: candidate.images || (candidate.image ? [candidate.image] : [])
    };
    setFormData(editFormData);
    setShowFormModal(true);
  };

  const handleDeleteCandidate = (candidate) => {
    setDeletingCandidate(candidate);
    setShowDeleteModal(true);
  };

  const handleFormSubmit = async (formData) => {
    // Store form data and show confirmation modal
    setPendingFormData(formData);
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setSaveLoading(true);
    try {
      const candidateData = {
        name: pendingFormData.name,
        category: pendingFormData.category,
        description: pendingFormData.description,
        images: pendingFormData.images,
        is_active: true
      };

      if (editingCandidate) {
        // Update existing candidate
        await apiClient.updateObject('candidates', editingCandidate.id, candidateData);
        await auditLogger.logUpdate('candidate', editingCandidate.id, candidateData.name, {
          category: candidateData.category,
          description: candidateData.description
        });
        toast.success('Candidate updated successfully');
      } else {
        // Create new candidate
        const newCandidate = await apiClient.createObject('candidates', candidateData);
        await auditLogger.logCreate('candidate', newCandidate.id, candidateData.name, {
          category: candidateData.category,
          description: candidateData.description
        });
        toast.success('Candidate created successfully');
      }

      // Reload candidates from database
      await refresh();
      
      // Dispatch event to notify other components (like dashboard) of the update
      window.dispatchEvent(new CustomEvent('candidatesUpdated'));
      
      setShowFormModal(false);
      setEditingCandidate(null);
      setShowConfirmModal(false);
      setPendingFormData(null);
    } catch (error) {
      // Error saving candidate - show specific error message
      console.error('Error saving candidate:', error);
      if (error.message && error.message.includes('413')) {
        toast.error('File too large. Please reduce image size and try again.');
      } else if (error.message && error.message.includes('Content Too Large')) {
        toast.error('File too large. Please reduce image size and try again.');
      } else {
        toast.error('Failed to save candidate. Please check your data and try again.');
      }
      setShowConfirmModal(false);
      setPendingFormData(null);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelSave = () => {
    setShowConfirmModal(false);
    setPendingFormData(null);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await apiClient.deleteObject('candidates', deletingCandidate.id);
      await auditLogger.logDelete('candidate', deletingCandidate.id, deletingCandidate.name, {
        category: deletingCandidate.category
      });
      toast.success('Candidate deleted successfully');
      
      // Reload candidates from database
      await refresh();
      
      // Dispatch event to notify other components (like dashboard) of the update
      window.dispatchEvent(new CustomEvent('candidatesUpdated'));
      
      setShowDeleteModal(false);
      setDeletingCandidate(null);
    } catch (error) {
      // Error deleting candidate - handled silently
      toast.error('Failed to delete candidate');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({ ...formData, image: e.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Search and filter handlers
  const handleSearchChange = (value) => {
    setSearchValue(value);
  };

  const handleSearch = (value) => {
    setSearchValue(value);
  };

  const handleFilterChange = (filterKey, filterValue) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: filterValue
    }));
  };

  const getCandidatesByCategory = (category) => {
    // Safety check: ensure filteredCandidates is an array
    if (!filteredCandidates || !Array.isArray(filteredCandidates)) {
      return [];
    }
    return filteredCandidates.filter(candidate => candidate.category === category);
  };

  // Get candidates by category with pagination
  const maleCandidates = getCandidatesByCategory('male');
  const femaleCandidates = getCandidatesByCategory('female');
  
  // Check if we're filtering by category
  const isFilteringByCategory = filters.status && (filters.status === 'male' || filters.status === 'female');
  
  // Calculate pagination for each category
  const candidatesPerPage = 3; // Show 3 candidates per category per page
  const maleTotalPages = Math.ceil(maleCandidates.length / candidatesPerPage);
  const femaleTotalPages = Math.ceil(femaleCandidates.length / candidatesPerPage);
  
  // Get paginated candidates for each category
  // When filtering by category, show all candidates of that category (no pagination)
  const maleStartIndex = isFilteringByCategory ? 0 : (maleCurrentPage - 1) * candidatesPerPage;
  const maleEndIndex = isFilteringByCategory ? maleCandidates.length : maleStartIndex + candidatesPerPage;
  const paginatedMaleCandidates = maleCandidates.slice(maleStartIndex, maleEndIndex);
  
  const femaleStartIndex = isFilteringByCategory ? 0 : (femaleCurrentPage - 1) * candidatesPerPage;
  const femaleEndIndex = isFilteringByCategory ? femaleCandidates.length : femaleStartIndex + candidatesPerPage;
  const paginatedFemaleCandidates = femaleCandidates.slice(femaleStartIndex, femaleEndIndex);

  // Image carousel helpers
  const getCandidateImages = (candidate) => {
    // Support both 'image' (single) and 'images' (array) for backward compatibility
    let images = [];
    
    if (candidate.images && Array.isArray(candidate.images)) {
      images = candidate.images;
    } else if (candidate.image) {
      images = [candidate.image];
    }
    
    // Convert image objects to URLs for display
    return images.map(img => {
      if (typeof img === 'string') {
        // Simple string path
        return img;
      } else if (img && img.dataUrl) {
        // Object with dataUrl property (base64)
        return img.dataUrl;
      } else if (img && img.url) {
        // Object with url property
        return img.url;
      }
      return img; // Fallback
    });
  };

  const getCurrentImageIndex = (candidateId) => {
    return candidateImageIndex[candidateId] || 0;
  };

  const nextImage = (candidateId, totalImages) => {
    setCandidateImageIndex(prev => ({
      ...prev,
      [candidateId]: ((prev[candidateId] || 0) + 1) % totalImages
    }));
  };

  const prevImage = (candidateId, totalImages) => {
    setCandidateImageIndex(prev => ({
      ...prev,
      [candidateId]: prev[candidateId] === 0 ? totalImages - 1 : (prev[candidateId] || 0) - 1
    }));
  };

  // Multi-select handlers
  const handleCandidateSelect = (candidateId) => {
    setSelectedCandidates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    // Safety check: ensure filteredCandidates is an array
    if (!filteredCandidates || !Array.isArray(filteredCandidates)) {
      return;
    }
    
    if (selectedCandidates.size === filteredCandidates.length) {
      setSelectedCandidates(new Set());
    } else {
      setSelectedCandidates(new Set(filteredCandidates.map(c => c.id)));
    }
  };

  const clearSelection = () => {
    setSelectedCandidates(new Set());
  };

  // Bulk action handlers
  const handleBulkDelete = () => {
    if (selectedCandidates.size === 0) return;
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    setBulkDeleteLoading(true);
    try {
      // Safety check: ensure filteredCandidates is an array
      if (!filteredCandidates || !Array.isArray(filteredCandidates)) {
        toast.error('No candidates available for deletion');
        return;
      }
      
      const candidatesToDelete = filteredCandidates.filter(c => selectedCandidates.has(c.id));
      
      // Delete each candidate from database
      await Promise.all(
        candidatesToDelete.map(candidate => 
          apiClient.deleteObject('candidates', candidate.id)
        )
      );
      
      toast.success(`${candidatesToDelete.length} candidate(s) deleted successfully`);
      
      // Reload candidates from database
      await refresh();
      
      // Dispatch event to notify other components (like dashboard) of the update
      window.dispatchEvent(new CustomEvent('candidatesUpdated'));
      
      setSelectedCandidates(new Set());
      setShowBulkDeleteModal(false);
    } catch (error) {
      // Error deleting candidates - handled silently
      toast.error('Failed to delete candidates');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleBulkExport = () => {
    if (selectedCandidates.size === 0) return;
    setShowExportModal(true);
  };


  const exportAsCSV = () => {
    // Safety check: ensure filteredCandidates is an array
    if (!filteredCandidates || !Array.isArray(filteredCandidates)) {
      toast.error('No candidates available for export');
      return;
    }
    
    const candidatesToExport = filteredCandidates.filter(c => selectedCandidates.has(c.id));
    const csvHeaders = ['Name', 'Category', 'Description', 'Votes'];
    const csvData = candidatesToExport.map(candidate => [
      candidate.name,
      candidate.category,
      candidate.description || '',
      voteCounts[candidate.id] || 0
    ]);
    
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `candidates-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
    toast.success(`${candidatesToExport.length} candidate(s) exported as CSV successfully`);
  };

  const exportAsPDF = () => {
    // Safety check: ensure filteredCandidates is an array
    if (!filteredCandidates || !Array.isArray(filteredCandidates)) {
      toast.error('No candidates available for export');
      return;
    }
    
    const candidatesToExport = filteredCandidates.filter(c => selectedCandidates.has(c.id));
    
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
          <h1 style="color: #2563eb; margin: 0 0 10px 0; font-size: 28px; font-weight: bold;">Candidates Export Report</h1>
          <p style="color: #666; margin: 5px 0; font-size: 14px;">Generated: ${new Date().toLocaleDateString()}</p>
          <p style="color: #666; margin: 5px 0; font-size: 14px;">Total Candidates: ${candidatesToExport.length}</p>
        </div>
        
        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">#</th>
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Name</th>
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Category</th>
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #374151; border-right: 1px solid #e2e8f0;">Description</th>
              <th style="padding: 12px; text-align: center; font-weight: bold; color: #374151;">Votes</th>
            </tr>
          </thead>
          <tbody>
            ${candidatesToExport.map((candidate, index) => `
              <tr style="border-bottom: 1px solid #e2e8f0; ${index % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f9fafb;'}">
                <td style="padding: 12px; color: #6b7280; border-right: 1px solid #e2e8f0; font-weight: 500;">${index + 1}</td>
                <td style="padding: 12px; color: #111827; border-right: 1px solid #e2e8f0; font-weight: 600;">${candidate.name}</td>
                <td style="padding: 12px; color: #374151; border-right: 1px solid #e2e8f0;">
                  <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; text-transform: capitalize; ${candidate.category === 'male' ? 'background-color: #dbeafe; color: #1e40af;' : 'background-color: #fce7f3; color: #be185d;'}">
                    ${candidate.category}
                  </span>
                </td>
                <td style="padding: 12px; color: #6b7280; border-right: 1px solid #e2e8f0; max-width: 200px; word-wrap: break-word;">${candidate.description || 'N/A'}</td>
                <td style="padding: 12px; text-align: center; color: #2563eb; font-weight: bold; font-size: 16px;">${voteCounts[candidate.id] || 0}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <!-- Footer -->
        <div style="margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          <p>This report was generated from the Voting System Admin Panel</p>
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(printElement);
    
    // Trigger print dialog
    window.print();
    
    // Clean up after printing
    setTimeout(() => {
      document.body.removeChild(printElement);
      document.head.removeChild(printStyles);
    }, 100);
    
    setShowExportModal(false);
    toast.success(`${candidatesToExport.length} candidate(s) ready for printing`);
  };

  const categoryOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-4 no-print">
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-2">
          Candidates Management
        </h1>
        <p className="text-gray-600">
          Manage voting candidates and their information.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 no-print">
        <SearchFilter
          placeholder="Search candidates..."
          value={searchValue}
          onChange={handleSearchChange}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          filters={filters}
          statusOptions={categoryOptions}
          showFilterIcon={true}
          className="bg-gray-50 border-gray-200"
        />
        
        {/* Filter Status Indicator */}
        {(filters.status || searchValue) && (
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Category: {filters.status === 'male' ? 'Male' : 'Female'}
                <button
                  onClick={() => handleFilterChange('status', '')}
                  className="ml-1 text-primary-600 hover:text-primary-800"
                >
                  ×
                </button>
              </span>
            )}
            {searchValue && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Search: "{searchValue}"
                <button
                  onClick={() => setSearchValue('')}
                  className="ml-1 text-gray-600 hover:text-gray-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Loading State - Handled by ProgressiveLoader below */}

      {/* Selection Header */}
      {!loading && filteredCandidates.length > 0 && (
        <div className="mb-4 p-3 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedCandidates.size === filteredCandidates.length && filteredCandidates.length > 0}
                  ref={(input) => {
                    if (input) input.indeterminate = selectedCandidates.size > 0 && selectedCandidates.size < filteredCandidates.length;
                  }}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All ({selectedCandidates.size}/{filteredCandidates.length})
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Progressive Loading with Skeleton */}
      <ProgressiveLoader
        loading={loading}
        error={error}
        onRetry={refresh}
        skeleton={CandidatesPageSkeleton}
      >
        {/* Male Candidates */}
        {maleCandidates.length > 0 && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Male Candidates</h2>
            {/* Only show pagination when not filtering by category */}
            {!isFilteringByCategory && (
              <div className="no-print">
                <Pagination
                  currentPage={maleCurrentPage}
                  totalPages={maleTotalPages}
                  onPageChange={setMaleCurrentPage}
                  totalItems={maleCandidates.length}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedMaleCandidates.map((candidate) => {
              const images = getCandidateImages(candidate);
              const currentIndex = getCurrentImageIndex(candidate.id);
              const hasImages = images.length > 0;
              const isSelected = selectedCandidates.has(candidate.id);
              
              return (
                <div 
                  key={candidate.id} 
                  className={`relative border-2 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
                    isSelected ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCandidateSelect(candidate.id)}
                >
                  {/* Selection Checkbox */}
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCandidateSelect(candidate.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>

                  {/* Image Carousel Section */}
                  <div className="relative h-56 bg-gradient-to-br from-gray-50 to-gray-100">
                    {hasImages ? (
                      <>
                        {/* Main Image */}
                        <LazyImage
                          src={images[currentIndex]}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Navigation Arrows */}
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                prevImage(candidate.id, images.length);
                              }}
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-all duration-200"
                            >
                              <ChevronLeftIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                nextImage(candidate.id, images.length);
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-all duration-200"
                            >
                              <ChevronRightIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        
                        {/* Image Counter Badge */}
                        {images.length > 1 && (
                          <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                            {currentIndex + 1}/{images.length}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <UserIcon className="h-20 w-20 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No image</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-5">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{candidate.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{candidate.description || 'No description provided'}</p>
                      
                      {/* Vote Count Badge */}
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700 mb-4">
                        <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                        {voteCounts[candidate.id] || 0} votes
                      </div>
                    </div>
                    
                        {/* Action Buttons */}
                        <div className="flex w-full space-x-2 no-print">
                          <Button
                            variant="secondaryOutline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCandidate(candidate);
                            }}
                            className="flex items-center flex-1"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCandidate(candidate);
                            }}
                            className="flex items-center flex-1"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Female Candidates */}
      {!loading && femaleCandidates.length > 0 && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Female Candidates</h2>
            {/* Only show pagination when not filtering by category */}
            {!isFilteringByCategory && (
              <div className="no-print">
                <Pagination
                  currentPage={femaleCurrentPage}
                  totalPages={femaleTotalPages}
                  onPageChange={setFemaleCurrentPage}
                  totalItems={femaleCandidates.length}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedFemaleCandidates.map((candidate) => {
              const images = getCandidateImages(candidate);
              const currentIndex = getCurrentImageIndex(candidate.id);
              const hasImages = images.length > 0;
              const isSelected = selectedCandidates.has(candidate.id);
              
              return (
                <div 
                  key={candidate.id} 
                  className={`relative border-2 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
                    isSelected ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCandidateSelect(candidate.id)}
                >
                  {/* Selection Checkbox */}
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCandidateSelect(candidate.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </div>

                  {/* Image Carousel Section */}
                  <div className="relative h-56 bg-gradient-to-br from-gray-50 to-gray-100">
                    {hasImages ? (
                      <>
                        {/* Main Image */}
                        <LazyImage
                          src={images[currentIndex]}
                          alt={candidate.name}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Navigation Arrows */}
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                prevImage(candidate.id, images.length);
                              }}
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-all duration-200"
                            >
                              <ChevronLeftIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                nextImage(candidate.id, images.length);
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-all duration-200"
                            >
                              <ChevronRightIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        
                        {/* Image Counter Badge */}
                        {images.length > 1 && (
                          <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                            {currentIndex + 1}/{images.length}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <UserIcon className="h-20 w-20 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No image</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-5">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{candidate.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{candidate.description || 'No description provided'}</p>
                      
                      {/* Vote Count Badge */}
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700 mb-4">
                        <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                        {voteCounts[candidate.id] || 0} votes
                      </div>
                    </div>
                    
                        {/* Action Buttons */}
                        <div className="flex w-full space-x-2 no-print">
                          <Button
                            variant="secondaryOutline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCandidate(candidate);
                            }}
                            className="flex items-center flex-1"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCandidate(candidate);
                            }}
                            className="flex items-center flex-1"
                          >
                            <TrashIcon className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Form Modal */}
      <FormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleFormSubmit}
        title={editingCandidate ? "Edit Candidate" : "Add New Candidate"}
        submitButtonText={editingCandidate ? "Update" : "Create"}
        isUpdate={!!editingCandidate}
        fields={[
          {
            name: 'name',
            label: 'Candidate Name',
            type: 'String',
            placeholder: 'Enter candidate name',
            required: true
          },
          {
            name: 'category',
            label: 'Category',
            type: 'select',
            options: categoryOptions,
            placeholder: 'Select category',
            required: true
          },
          {
            name: 'description',
            label: 'Description',
            type: 'Textarea',
            placeholder: 'Enter candidate description (optional)'
          },
          {
            name: 'images',
            label: 'Image Upload',
            type: 'file',
            multiple: true,
            maxFiles: 5,
            maxSize: 2 * 1024 * 1024, // 2MB - reduced from 10MB to avoid server limits
            accept: 'image/*',
            placeholder: 'Upload candidate photos (multiple files allowed)',
            showPreview: true,
            previewSize: 'w-24 h-24',
            required: true
          }
        ]}
        initialData={formData}
      />

      {/* Save Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCancelSave}
        onConfirm={handleConfirmSave}
        title="Confirm Save"
        message={`Are you sure you want to ${editingCandidate ? 'update' : 'create'} this candidate?`}
        confirmLabel={editingCandidate ? "Update" : "Create"}
        cancelLabel="Cancel"
        loading={saveLoading}
        variant="info"
        icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Candidate"
        message={`Are you sure you want to delete "${deletingCandidate?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleteLoading}
        icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.318 18.5c-.77.833.192 2.5 1.732 2.5z"
        variant="danger"
      />

      {/* Bulk Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Selected Candidates"
        message={`Are you sure you want to delete ${selectedCandidates.size} selected candidate(s)? This action cannot be undone.`}
        confirmLabel="Delete All"
        cancelLabel="Cancel"
        loading={bulkDeleteLoading}
        icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.318 18.5c-.77.833.192 2.5 1.732 2.5z"
        variant="danger"
      />

      {/* Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 transition-opacity bg-black/50" onClick={() => setShowExportModal(false)}></div>
            
            {/* Modal Content */}
            <div className="relative z-50 w-full max-w-md p-6 overflow-hidden text-left transition-all transform bg-white shadow-xl rounded-xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Export Selected Candidates</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              
              {/* Content */}
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Choose export format for {selectedCandidates.size} selected candidate(s):
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

      {/* No candidates found */}
      {filteredCandidates.length === 0 && (
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
          <p className="text-gray-600 mb-4">
            {error 
              ? 'Unable to load candidates. Please check your connection and try again.'
              : searchValue || Object.keys(filters).length > 0 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Add your first candidate to get started.'
            }
          </p>
          {error ? (
            <Button
              variant="primary"
              onClick={refresh}
              className="flex items-center mx-auto"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Retry
            </Button>
          ) : (!searchValue && Object.keys(filters).length === 0) && (
            <Button
              variant="primary"
              onClick={handleAddCandidate}
              className="flex items-center mx-auto"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Candidate
            </Button>
          )}
        </div>
      )}
      </ProgressiveLoader>

      {/* Floating Action Button */}
      <div className="no-print">
        <SmartFloatingActionButton 
          variant="single"
          icon="PlusIcon"
          label="Create new candidate"
          action={handleAddCandidate}
          selectedCount={selectedCandidates.size}
          bulkActions={[
            { name: 'Delete Selected', icon: 'TrashIcon', action: handleBulkDelete, color: 'bg-red-600' },
            { name: 'Export Selected', icon: 'ArrowDownTrayIcon', action: handleBulkExport, color: 'bg-blue-600' }
          ]}
          quickActions={[
            { name: 'Add Candidate', icon: 'PlusIcon', action: handleAddCandidate, color: 'bg-primary-600' },
            { name: 'Import Candidates', icon: 'ArrowUpTrayIcon', action: () => toast.info('Import feature coming soon'), color: 'bg-green-600' },
            { name: 'Export All Candidates', icon: 'ArrowDownTrayIcon', action: () => {
              if (filteredCandidates.length === 0) {
                toast.error('No candidates to export');
                return;
              }
              setShowExportModal(true);
            }, color: 'bg-blue-600' }
          ]}
        />
      </div>
    </div>
  );
};

export default CandidatesPage;
