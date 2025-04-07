const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const twilio = require('twilio');
const OpenAI = require('openai');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Twilio Configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC***************************59';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'aa*****************************39';
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+15**********77';
const twilioClient = new twilio(accountSid, authToken);

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

// Donation Schema
const donationSchema = new mongoose.Schema({
    name: String,
    email: String,
    mobile: String,
    foodDetails: String,
    expiryDate: Date,
    location: String,
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, default: 'Listed on site', enum: ['Listed on site', 'Accepted'] }
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

// Accept a Donation + Send SMS
app.patch("/api/donations/:id/accept", async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) {
            return res.status(404).json({ message: "Donation not found" });
        }
        donation.status = 'Accepted';
        await donation.save();
        console.log("Donation accepted:", donation);

        // Send SMS
        await twilioClient.messages.create({
            body: 'Your donation has been accepted',
            from: twilioPhoneNumber,
            to: donation.mobile
        });
        console.log(`SMS sent to ${donation.mobile}`);

        res.json({ message: "Donation accepted successfully!" });
    } catch (error) {
        console.error("Error accepting donation or sending SMS:", error);
        res.status(500).json({ message: "Error accepting donation or sending SMS!", error: error.message });
    }
});

// AI Chat Endpoint (OpenAI GPT Chatbot)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "sk*****************************************A"
});

app.post("/api/chat", async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        const context = "You are an assistant for the Community Food Donation Platform, a web app that connects food donors with those in need. Users can submit food donations with details like name, email, mobile, food type, expiry date, and location via /submit-donation. They can request food via /api/request-food. Donations are stored in MongoDB, and accepted donations trigger SMS notifications via Twilio. Help users with donating, requesting, troubleshooting, and understanding the platform.";

        let completion;
        try {
            completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: context },
                    { role: "user", content: message },
                ],
            });
        } catch (error) {
            if (error.status === 429) {
                console.warn("GPT-4o quota exceeded, falling back to GPT-3.5-turbo");
                completion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: context },
                        { role: "user", content: message },
                    ],
                });
            } else {
                throw error;
            }
        }

        const reply = completion.choices[0].message.content;

        if (!reply || typeof reply !== "string" || reply.trim() === "") {
            console.error("Invalid reply from OpenAI:", completion);
            return res.status(500).json({ error: "Invalid response from AI" });
        }

        console.log("Chatbot response:", { message, reply }); // Additional logging
        res.json({ reply });
    } catch (error) {
        console.error("AI Chat error:", error.message);
        res.status(500).json({ error: "AI response failed", details: error.message });
    }
});



// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
