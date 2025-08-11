"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { getImageUrl, listImages } from '@/lib/supabase-storage';

export default function UrlTest() {
    const [urls, setUrls] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        testUrls();
    }, []);

    const testUrls = async () => {
        try {
            console.log('🔍 Testing URL generation...');
            
            // Test direct URL generation
            const directUrl = getImageUrl('carousel/dump1.jpg');
            console.log('Direct URL:', directUrl);
            
            // Test listing files
            const { data, error } = await listImages('carousel');
            console.log('List result:', { data, error });
            
            if (data && data.length > 0) {
                const generatedUrls = data
                    .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
                    .map(file => {
                        const url = getImageUrl(`carousel/${file.name}`);
                        console.log(`URL for ${file.name}: ${url}`);
                        return url;
                    });
                
                setUrls(generatedUrls);
            } else {
                // Test with known filenames
                const testUrls = [
                    getImageUrl('carousel/dump1.jpg'),
                    getImageUrl('carousel/dump2.jpg'),
                    getImageUrl('carousel/dump3.jpg'),
                    getImageUrl('carousel/dump4.jpg'),
                ];
                setUrls(testUrls);
            }
        } catch (err) {
            console.error('Error in testUrls:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Testing URLs...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>URL Test - Next.js Image vs Regular img</h2>
            {urls.map((url, index) => (
                <div key={index} style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
                    <p><strong>URL:</strong> {url}</p>
                    
                    <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                        {/* Regular img tag */}
                        <div style={{ flex: 1 }}>
                            <h4>Regular &lt;img&gt; tag:</h4>
                            <img 
                                src={url} 
                                alt={`Regular img ${index}`}
                                style={{ maxWidth: '200px', height: 'auto', border: '2px solid green' }}
                                onLoad={() => console.log(`✅ Regular img ${index} loaded successfully`)}
                                onError={() => console.log(`❌ Regular img ${index} failed to load`)}
                            />
                        </div>

                        {/* Next.js Image component */}
                        <div style={{ flex: 1 }}>
                            <h4>Next.js &lt;Image&gt; component:</h4>
                            <Image
                                src={url}
                                alt={`Next.js Image ${index}`}
                                width={200}
                                height={150}
                                style={{ border: '2px solid blue' }}
                                onLoad={() => console.log(`✅ Next.js Image ${index} loaded successfully`)}
                                onError={() => console.log(`❌ Next.js Image ${index} failed to load`)}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4>Next.js &lt;Image&gt; framer:</h4>
                            <Image
                                src={"https://framerusercontent.com/images/ww0GmyZcc1yAIo8GBgwRahYQjtc.png?scale-down-to=1024"}
                                alt={`Next.js Image ${index}`}
                                width={200}
                                height={150}
                                style={{ border: '2px solid blue' }}
                                onLoad={() => console.log(`✅ Next.js Image ${index} loaded successfully`)}
                                onError={() => console.log(`❌ Next.js Image ${index} failed to load`)}
                            />
                            <img
                                src={"https://framerusercontent.com/images/ww0GmyZcc1yAIo8GBgwRahYQjtc.png?scale-down-to=1024"}
                                alt={`Next.js Image ${index}`}
                                width={200}
                                height={150}
                                style={{ border: '2px solid blue' }}
                                onLoad={() => console.log(`✅ Next.js Image ${index} loaded successfully`)}
                                onError={() => console.log(`❌ Next.js Image ${index} failed to load`)}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
