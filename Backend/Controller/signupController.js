const Admin = require('../Models/Admin');
const admin = require('firebase-admin');

exports.signupAdmin = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // 1. Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: false,
      disabled: false
    });

    // 2. Save to MongoDB
    const newAdmin = new Admin({
      uid: userRecord.uid,
      email: userRecord.email,
      fullName,
      role: 'admin'
    });

    await newAdmin.save();

    // 3. Optional: Save to Firestore
    await admin.firestore().collection('admins').doc(userRecord.uid).set({
      email: userRecord.email,
      fullName,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        uid: userRecord.uid,
        email: userRecord.email,
        fullName
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle Firebase errors
    let errorMessage = error.message;
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = "Email already in use";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "Invalid email address";
    }
    
    res.status(400).json({
      success: false,
      message: errorMessage || 'Signup failed'
    });
  }
};