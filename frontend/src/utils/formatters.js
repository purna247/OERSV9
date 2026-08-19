export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Returns a status color object based on standard OERS statuses
export const getStatusColors = (status) => {
  switch (status?.toUpperCase()) {
    case 'CONFIRMED':
    case 'ACTIVE':
    case 'PAID':
      return { bg: 'bg-mint/10', text: 'text-mint', border: 'border-mint/20' };
    case 'INITIATED':
    case 'PENDING':
      return { bg: 'bg-soft-purple/10', text: 'text-soft-purple', border: 'border-soft-purple/20' };
    case 'FAILED':
    case 'DETAINED':
    case 'CANCELLED':
      return { bg: 'bg-coral/10', text: 'text-coral', border: 'border-coral/20' };
    case 'GRADUATED':
      return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
  }
};
