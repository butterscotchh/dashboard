export const testApiConnection = async () => {
  console.group('🔗 API Connection Test');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('API URL:', process.env.REACT_APP_API_URL);
  
  try {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/health`);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', data);
    console.log('✅ API Connection: SUCCESS');
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ API Connection: FAILED', error);
    return { success: false, error };
  } finally {
    console.groupEnd();
  }
};

// Panggil di App.js untuk test saat development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    testApiConnection();
  }, 1000);
}