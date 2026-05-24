const axios = require('axios');

const testComplaint = async () => {
  try {
    const response = await axios.post('http://localhost:3001/complaints', {
      subject: 'Test Corruption',
      description: 'Bribery complaint test',
      complainant_name: 'V Kumar',
      complainant_email: 'septsh13@gmail.com',
      complainant_phone: '+919960034524'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ SUCCESS:', response.status, response.data);
  } catch (err) {
    console.error('❌ ERROR:', {
      status: err.response?.status,
      data: err.response?.data,
      message: err.message,
      fullError: err
    });
  }
};

testComplaint();
