export const normalizeError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const status = error.response.status;
    const data = error.response.data;

    let message = data?.message || "An unexpected error occurred.";

    if (status === 401) {
      message = data?.message || "Session expired. Please log in again.";
    } else if (status === 403) {
      message = data?.message || "You do not have permission to perform this action.";
    } else if (status === 429) {
      message = data?.message || "Too many requests. Please try again later.";
    } else if (status === 422 || status === 400) {
      message = data?.message || "Validation failed. Please check your inputs.";
    } else if (status >= 500) {
      message = "Server error. Please try again later.";
    }

    if (import.meta.env.DEV) {
      console.error("[API Error Response]:", error.response);
    }

    return {
      status,
      message,
      data,
      isNetworkError: false,
    };
  } else if (error.request) {
    // The request was made but no response was received
    if (import.meta.env.DEV) {
      console.error("[API Network Error]:", error.request);
    }
    return {
      status: 0,
      message: "Network error. Please check your connection and try again.",
      data: null,
      isNetworkError: true,
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    if (import.meta.env.DEV) {
      console.error("[API Request Setup Error]:", error.message);
    }
    return {
      status: 0,
      message: "An unexpected error occurred while setting up the request.",
      data: null,
      isNetworkError: false,
    };
  }
};
