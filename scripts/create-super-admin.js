const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

async function createSuperAdmin() {
    // Configuration
    const email = 'super@admin.com';
    const password = 'SuperAdmin@123';
    const mongoUri = 'mongodb://127.0.0.1:27017/school_api';

    let client;
    try {
        // Connect to MongoDB with options
        client = await MongoClient.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('Connected to MongoDB');
        const db = client.db();

        // Check if super admin already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            console.log('Super admin already exists');
            return;
        }

        // Generate password hash
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create super admin user
        const result = await db.collection('users').insertOne({
            email,
            password: passwordHash,
            role: 'super-admin',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('Super admin created successfully:', result.insertedId);
        console.log('Email:', email);
        console.log('Password:', password);

    } catch (error) {
        console.error('Error creating super admin:', error);
        throw error;
    } finally {
        if (client) {
            await client.close();
            console.log('MongoDB connection closed');
        }
    }
}

// Run the function with proper error handling
createSuperAdmin()
    .then(() => {
        console.log('Script completed successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error('Script failed:', err);
        process.exit(1);
    }); 