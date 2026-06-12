"use client";
import { motion } from "framer-motion";
import axios from "axios";
import { useEffect } from "react";

export default function GoogleAuthButton({ label = "Continue with Google" }) {
    
    useEffect(() => {
        /**
         * STEP 1: Initialize Google Identity Services
         * This does NOT redirect.
         * Google will return an ID token via callback.
         */
        if (window.google) {
            window.google.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                callback: handleGoogleResponse
            })
            /**
             * STEP 2: Render Google button
             * We render it into a hidden div
             * and trigger it programmatically for full UI control
             */
            window.google.accounts.id.renderButton(
                document.getElementById("google-gis-btn"),
                {
                    theme: "outline",
                    size: "large",
                    width: "300"
                }
            );
        }
    }, []);

    /**
     * STEP 3: Google sends ID token here after successful login
     **/
    const handleGoogleResponse = async (response) => {
        try {
            /**
             * STEP 4: Send ID token to backend
             * Backend will:
             * - Verify token with Google
             * - Create / link user
             * - Issue access + refresh tokens
             * - Set refreshToken cookie
             **/
            await axios.post(
                "http://localhost:4001/api/v1/auth/google-auth",
                { idToken: response.credential },
                { withCredentials: true }
            );
            /**
             * STEP 5: Backend session is ready
             * Frontend just redirects
             **/
            window.location.href = "/dashboard";
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div>
            <div id="google-gis-btn"></div>
        </div>
    );
}
