import React from 'react';
import { MapPin, Calendar, Ruler, Anchor } from 'lucide-react';
import { motion } from 'framer-motion';

const BoatCard = ({ boat, index }) => {
    const {
        Model,
        Builder,
        SellPriceFormatted,
        YearBuilt,
        Length,
        Images,
        Country
    } = boat;

    const imageUrl = boat.ImageUrl || (Images && Images.length > 0 ? Images[0].ImageUrl : null);

    // Upgrade low-res 128 thumbnails to 512 for better quality
    let displayImage = 'https://via.placeholder.com/400x300?text=No+Image';

    if (imageUrl) {
        if (imageUrl.includes('.128.jpg')) {
            displayImage = imageUrl.replace('.128.jpg', '.512.jpg');
        } else if (imageUrl.endsWith('.512.jpg')) {
            displayImage = imageUrl;
        } else {
            // Assume base URL if no specific sizing found
            displayImage = `${imageUrl}.512.jpg`;
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className="group bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden border border-slate-100"
        >
            <div className="relative aspect-[4/3] overflow-hidden">
                <img
                    src={displayImage}
                    alt={Model}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 will-change-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                <div className="absolute top-4 right-4">
                    <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
                        <span className="text-sm font-bold text-slate-900">{SellPriceFormatted || "Price on Request"}</span>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="mb-4">
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">{Builder}</h4>
                    <h3 className="font-display font-bold text-xl text-slate-900 group-hover:text-indigo-600 transition-colors truncate" title={Model}>
                        {Model}
                    </h3>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2 py-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Calendar size={16} className="text-indigo-400" />
                        <span>{YearBuilt}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Ruler size={16} className="text-indigo-400" />
                        <span>{Length}m</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm col-span-2">
                        <MapPin size={16} className="text-indigo-400" />
                        <span className="truncate">{Country || "Location N/A"}</span>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">ID: {boat.BoatID}</span>
                    <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        View Details →
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default BoatCard;
