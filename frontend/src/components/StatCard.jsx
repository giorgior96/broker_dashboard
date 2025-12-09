import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const StatCard = ({ title, value, subtext, icon: Icon, className, delay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={cn(
                "glass-card p-6 rounded-2xl flex items-start justify-between relative overflow-hidden group",
                className
            )}
        >
            <div className="relative z-10">
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">{title}</h3>
                <div className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</div>
                {subtext && <p className="mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full inline-block">{subtext}</p>}
            </div>

            {Icon && (
                <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm">
                    <Icon size={24} strokeWidth={1.5} />
                </div>
            )}

            {/* Decorative gradient blob */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
        </motion.div>
    );
};

export default StatCard;
