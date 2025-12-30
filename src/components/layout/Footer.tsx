import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="w-full py-4 text-center z-10">
            <p className="text-white/40 text-xs">
                © {new Date().getFullYear()} Astromic AI.{" "}
                <a
                    href="https://astromic.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white/80 transition-colors underline decoration-white/20"
                >
                    Privacy Policy
                </a>
            </p>
        </footer>
    );
};

export default Footer;
