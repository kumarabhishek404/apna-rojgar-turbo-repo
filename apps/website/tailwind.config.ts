import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      /* ---------------- COLORS ---------------- */

      colors: {
        primary: "#22409a",
        primaryLight: "#4f6fd8",
        primaryDark: "#162b6b",

        glass: "rgba(255,255,255,0.15)",

        background: "#f9fafc",
      },

      /* ---------------- GRADIENTS ---------------- */

      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #22409a 0%, #4f6fd8 100%)",

        "gradient-hero": "radial-gradient(circle at 20% 30%, #4f6fd8, #22409a)",

        "gradient-glow":
          "radial-gradient(circle at center, rgba(79,111,216,0.4), transparent)",

        "gradient-mesh": "linear-gradient(120deg, #22409a, #4f6fd8, #8da2ff)",
      },

      /* ---------------- SHADOWS ---------------- */

      boxShadow: {
        glass: "0 8px 32px rgba(31, 38, 135, 0.37)",

        premium: "0 20px 40px rgba(0,0,0,0.15), 0 5px 15px rgba(0,0,0,0.05)",

        glow: "0 0 40px rgba(79,111,216,0.6)",

        soft: "0 10px 25px rgba(0,0,0,0.08)",
      },

      /* ---------------- BLUR ---------------- */

      backdropBlur: {
        xs: "2px",
      },

      /* ---------------- BORDER ---------------- */

      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },

      /* ---------------- ANIMATIONS ---------------- */

      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },

        glow: {
          "0%,100%": { opacity: "0.8" },
          "50%": { opacity: "1" },
        },

        gradientShift: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },

        fadeUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(40px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
      },

      animation: {
        float: "float 6s ease-in-out infinite",

        glow: "glow 3s ease-in-out infinite",

        gradient: "gradientShift 8s ease infinite",

        fadeUp: "fadeUp 0.8s ease forwards",
      },
    },
  },

  plugins: [],
};

export default config;
