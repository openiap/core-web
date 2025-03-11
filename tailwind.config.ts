// import { fontFamily } from "tailwindcss/defaultTheme";
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
	darkMode: ["class"],
	content: ["./src/**/*.{html,js,svelte,ts}"],
	safelist: ["dark"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px"
			}
		},
		extend: {
			colors: {
				test: '#EF4444',
				bw50: "#FDFDFD",
				bw100: "#EEEFF1",
				bw200: "#D9D9D9",
				bw300: "#ACADAE",
				bw400: "#9FA1A6",
				bw500: "#86888E",
				bw600: "#575B62",
				bw700: "#313337",
				bw800: "#27292E",
				bw850: "#232529",
				bw900: "#191A1E",
				bw950: "#0C0D0E",
				bw1000: "#282A2F",

				darkagenttab: "#3B3E42",

				lightbg: "#F5F5F5",

				lighttableheader: "#E6E6E6",
				darktableheader: "#1B1D21",

				// entities page
				lightentities: "#61929A",
				lightentitiesselected: "#46818A",
				darkentities: "#46686D",
				darkentitiesselected: "#304A4E",

				// Green Button
				darkbggreen: "#304E46",
				darkbghovergreen: "#426A5F",
				darktextgreen: "#DDEFE6",
				darkbordergreen: "#56846D",
				lightbggreen: "#BDE9CF",
				lighthovergreen: "#96D5AF",
				lighttextgreen: "#145A41",
				lightbordergreen: "#7CD29B",

				// Green red
				darkbgred: "#4E3030",
				darkbghoverred: "#614242",
				darktextred: "#EFDEDD",
				darkborderred: "#886260",
				lightbgred: "#E1B3AE",
				lighthoverred: "#CE8B84",
				lighttextred: "#501611",
				lightborderred: "#D37C7C",

				darkbgpurple: "#49304E",
				darktextpurple: "#EFDDED",
				darkborderpurple: "#815E88",
				lightbgpurple: "#EBC3EC",
				lighttextpurple: "#501052",
				lightborderpurple: "#BE79C0",

				darkbgyellow: "#5C4D3B",
				darktextyellow: "#F4E3CE",
				darkborderyellow: "#B09777",
				lightbgyellow: "#FAF4C7",
				lighttextyellow: "#675810",
				lightborderyellow: "#D4C44F",

				darkbgorange: "#5C4D3B",
				darktextorange: "#F4E3CE",
				darkborderorange: "#B09777",

				buttonlink: "#91A4DA",
				// lightbgorange: "#F4E3CE",
				// lighttextorange: "#F4E3CE",
				// lightborderorange: "#F4E3CE",

				border: "hsl(var(--border) / <alpha-value>)",
				input: "hsl(var(--input) / <alpha-value>)",
				ring: "hsl(var(--ring) / <alpha-value>)",
				background: "hsl(var(--background) / <alpha-value>)",
				foreground: "hsl(var(--foreground) / <alpha-value>)",
				primary: {
					DEFAULT: "hsl(var(--primary) / <alpha-value>)",
					foreground: "hsl(var(--primary-foreground) / <alpha-value>)"
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
					foreground: "hsl(var(--secondary-foreground) / <alpha-value>)"
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
					foreground: "hsl(var(--destructive-foreground) / <alpha-value>)"
				},
				muted: {
					DEFAULT: "hsl(var(--muted) / <alpha-value>)",
					foreground: "hsl(var(--muted-foreground) / <alpha-value>)"
				},
				accent: {
					DEFAULT: "hsl(var(--accent) / <alpha-value>)",
					foreground: "hsl(var(--accent-foreground) / <alpha-value>)"
				},
				popover: {
					DEFAULT: "hsl(var(--popover) / <alpha-value>)",
					foreground: "hsl(var(--popover-foreground) / <alpha-value>)"
				},
				card: {
					DEFAULT: "hsl(var(--card) / <alpha-value>)",
					foreground: "hsl(var(--card-foreground) / <alpha-value>)"
				},
				sidebar: {
					DEFAULT: "hsl(var(--sidebar-background))",
					foreground: "hsl(var(--sidebar-foreground))",
					primary: "hsl(var(--sidebar-primary))",
					"primary-foreground": "hsl(var(--sidebar-primary-foreground))",
					accent: "hsl(var(--sidebar-accent))",
					"accent-foreground": "hsl(var(--sidebar-accent-foreground))",
					border: "hsl(var(--sidebar-border))",
					ring: "hsl(var(--sidebar-ring))",
				},
			},
			borderRadius: {
				xl: "calc(var(--radius) + 4px)",
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)"
			},
			fontFamily: {
				"custom": ['DM Sans', 'serif'],
			},
			fontSize: {
				'smaller': ['0.875rem', '1rem'], // 14px font size, 16px line height
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--bits-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--bits-accordion-content-height)" },
					to: { height: "0" },
				},
				"caret-blink": {
					"0%,70%,100%": { opacity: "1" },
					"20%,50%": { opacity: "0" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"caret-blink": "caret-blink 1.25s ease-out infinite",
			},
			boxShadow: {
				light: '0px 2px 4px rgba(0, 0, 0, 0.15)', // Custom shadow
				dark: '0px 4px 8px rgba(0, 0, 0, 0.2)', // Custom shadow
			},
		},
	},
	plugins: [tailwindcssAnimate],
};

export default config;
