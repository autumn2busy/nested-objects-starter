import React from 'react';

interface VideoPlayerProps {
    url: string;
    title?: string;
}

export default function VideoPlayer({ url, title }: VideoPlayerProps) {
    // Extract video ID from YouTube URL
    const getVideoId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = getVideoId(url);

    if (!videoId) {
        return (
            <div className="w-full aspect-video bg-slate-900 rounded-xl flex items-center justify-center border-4 border-slate-900 shadow-2xl">
                <p className="text-slate-400">Invalid Video URL</p>
            </div>
        );
    }

    return (
        <div className="w-full aspect-video bg-slate-900 rounded-xl overflow-hidden border-4 border-slate-900 shadow-xl mx-auto my-6 max-w-4xl">
            <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                title={title || "Training Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
}
