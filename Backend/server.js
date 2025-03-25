const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/foodDonationDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error:", err));

// Routes
app.use('/api/auth', authRoutes);

// Complaint Schema
const complaintSchema = new mongoose.Schema({
    name: String,
    email: String,
    complaint: String,
    date: { type: Date, default: Date.now }
});

const Complaint = mongoose.model("Complaint", complaintSchema);

// Food Request Schema
const foodRequestSchema = new mongoose.Schema({
    requestorName: { type: String, required: true },
    requestorMobile: { type: String, required: true },
    requestorLocation: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, default: 'pending', enum: ['pending', 'accepted'] }
});

const FoodRequest = mongoose.model("FoodRequest", foodRequestSchema);

// Donation Schema with Status
const donationSchema = new mongoose.Schema({
    name: String,
    email: String,
    mobile: String,
    foodDetails: String,
    expiryDate: Date,
    location: String,
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, default: 'Listed on site', enum: ['Listed on site', 'Accepted'] } // New status field
});

const Donation = mongoose.model('Donation', donationSchema);

// Handle Complaint Submission
app.post("/api/submit-complaint", async (req, res) => {
    try {
        const { name, email, complaint } = req.body;
        if (!name || !email || !complaint) {
            return res.status(400).json({ message: "All fields are required!" });
        }
        const newComplaint = new Complaint({ name, email, complaint });
        await newComplaint.save();
        console.log("Complaint saved:", newComplaint);
        res.json({ message: "Complaint submitted successfully!" });
    } catch (error) {
        console.error("Error saving complaint:", error);
        res.status(500).json({ message: "Error submitting complaint!", error: error.message });
    }
});

// Handle Food Request Submission
app.post("/api/request-food", async (req, res) => {
    try {
        const { requestorName, requestorMobile, requestorLocation } = req.body;
        if (!requestorName || !requestorMobile || !requestorLocation) {
            return res.status(400).json({ message: "All fields are required!" });
        }
        const newRequest = new FoodRequest({ requestorName, requestorMobile, requestorLocation });
        await newRequest.save();
        console.log("Food request saved:", newRequest);
        res.status(201).json({ message: "Food request submitted successfully!" });
    } catch (error) {
        console.error("Error saving food request:", error);
        res.status(500).json({ message: "Error submitting food request!", error: error.message });
    }
});

// Get All Food Requests
app.get("/api/food-requests", async (req, res) => {
    try {
        const requests = await FoodRequest.find().sort({ timestamp: -1 });
        res.json(requests);
    } catch (error) {
        console.error("Error fetching food requests:", error);
        res.status(500).json({ message: "Error fetching requests!", error: error.message });
    }
});

// Accept a Food Request
app.patch("/api/food-requests/:id/accept", async (req, res) => {
    try {
        const request = await FoodRequest.findById(req.params.id);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        request.status = 'accepted';
        await request.save();
        console.log("Food request accepted:", request);
        res.json({ message: "Request accepted successfully!" });
    } catch (error) {
        console.error("Error accepting request:", error);
        res.status(500).json({ message: "Error accepting request!", error: error.message });
    }
});

// Delete a Food Request
app.delete("/api/food-requests/:id", async (req, res) => {
    try {
        const request = await FoodRequest.findByIdAndDelete(req.params.id);
        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }
        console.log("Food request deleted:", request);
        res.json({ message: "Request deleted successfully!" });
    } catch (error) {
        console.error("Error deleting request:", error);
        res.status(500).json({ message: "Error deleting request!", error: error.message });
    }
});

// Handle Donation Submission
app.post("/submit-donation", async (req, res) => {
    try {
        const { name, email, mobile, foodDetails, expiryDate, location } = req.body;

        if (!name || !email || !mobile || !foodDetails || !expiryDate || !location) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        const newDonation = new Donation({
            name,
            email,
            mobile,
            foodDetails,
            expiryDate,
            location
        });

        await newDonation.save();
        console.log("Donation saved:", newDonation);
        res.status(201).json({ message: "Donation submitted successfully!" });
    } catch (error) {
        console.error("Error saving donation:", error);
        res.status(500).json({ message: "Error submitting donation!", error: error.message });
    }
});

// Get All Donations
app.get("/api/donations", async (req, res) => {
    try {
        const donations = await Donation.find().sort({ submittedAt: -1 });
        res.json(donations);
    } catch (error) {
        console.error("Error fetching donations:", error);
        res.status(500).json({ message: "Error fetching donations!", error: error.message });
    }
});

// Accept a Donation (New Route)
app.patch("/api/donations/:id/accept", async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: "Donation not found" });
        }
        donation.status = 'Accepted';
        await donation.save();
        console.log("Donation accepted:", donation);
        res.json({ message: "Donation accepted successfully!" });
    } catch (error) {
        console.error("Error accepting donation:", error);
        res.status(500).json({ message: "Error accepting donation!", error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));