const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    // Using a fixed ID to ensure only one settings document exists
    singleton: {
        type: String,
        default: 'main_settings',
        unique: true
    },
    blockPrice: {
        type: Number,
        required: [true, 'Blok fiyatı zorunludur.'],
        default: 300
    },
    autoApprove: {
        type: Boolean,
        default: false
    },
    maxFileSize: {
        type: Number,
        default: 2 // in Megabytes
    }
}, { timestamps: true });

// Helper method to get the settings document
settingSchema.statics.getSettings = async function() {
    let settings = await this.findOne({ singleton: 'main_settings' });
    if (!settings) {
        // If no settings exist, create them with default values
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('Setting', settingSchema);
