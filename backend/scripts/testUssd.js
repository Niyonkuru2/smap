import axios from 'axios';

const testUSSD = async (phoneNumber, text) => {
    try {
        const response = await axios.post('http://localhost:3001/ussd/test', {
            phoneNumber,
            text
        });
        
        console.log('Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
};

// Test different flows
const testFlows = async () => {
    console.log('=== Testing Main Menu ===');
    await testUSSD('250788123456', '');
    
    console.log('\n=== Testing Login ===');
    await testUSSD('250788123456', '1');
    
    console.log('\n=== Testing Consumer Menu ===');
    await testUSSD('250788123456', '1*1');
    
    console.log('\n=== Testing Check Prices ===');
    await testUSSD('250788123456', '1*1*1');
    
    console.log('\n=== Testing Select Market ===');
    await testUSSD('250788123456', '1*1*1*1');
    
    console.log('\n=== Testing Select Product ===');
    await testUSSD('250788123456', '1*1*1*1*1');
};

// Run tests
testFlows();