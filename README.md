# CarbonFlow: An AI-Powered Marketplace for Social Good

**Live Application:** [carbonflow.net](https://carbonflow.net)

**A Submission for Katy Youth Hacks 2025**

CarbonFlow is an intelligent B2B platform designed to accelerate the fight against climate change by creating a transparent and profitable market for captured carbon. By connecting CO₂ producers with innovative consumers, we turn an environmental liability into a valuable asset, creating a powerful economic engine for social and environmental good.

---

## 🌳 Inspiration & Social Good Theme

Our inspiration was to tackle one of the biggest challenges in sustainability: making carbon capture economically viable. The theme of **social good** is at the heart of our project. We believe the most effective way to benefit the community is to create sustainable, market-based solutions to systemic problems. CarbonFlow directly contributes to the social good by:
* **Incentivizing Climate Action:** We create a clear financial reason for companies to invest in carbon capture technology.
* **Empowering Sustainable Industries:** We help innovative businesses (like vertical farms and biofuel producers) source the CO₂ they need to grow.
* **Building a Circular Economy:** Our platform is a practical tool for building a circular economy, where one industry's waste becomes another's raw material.

## ✨ What it Does

CarbonFlow is a feature-rich, full-stack application that serves as a complete ecosystem for the carbon utilization market.

* **Secure User Authentication:** A complete user registration and login system with secure password hashing (`bcrypt`) and session management (`JWT`) provides a professional and secure user experience.
* **Intelligent Vector-Based Matching:** Our core innovation is a sophisticated matching engine that goes beyond simple filters. It converts company profiles into numerical vectors to find the most conceptually compatible partners based on dozens of factors.
* **AI-Powered Strategic Analysis:** For every potential partnership, our platform uses an Azure OpenAI "consultant" to generate a detailed report with a ranked list of opportunities, a deep justification, and strategic pros and cons.
* **Full Producer & Consumer Dashboards:** CarbonFlow is a true two-sided marketplace, with dedicated, feature-rich dashboards for both CO₂ producers looking for buyers and consumers looking for suppliers.
* **User Personalization:** Users can manage their profiles, set dashboard and notification preferences, and track their sustainability goals, making CarbonFlow a tailored enterprise tool.

## 🛠️ How We Built It

We built CarbonFlow on a modern, decoupled, full-stack architecture designed for scalability and performance.

* **Frontend:** A dynamic and responsive single-page application built with **React** and **Vite**. We used **React Router** for our multi-page architecture, **Leaflet** for interactive map visualizations, and a custom component library for a polished UI.
* **Backend:** A robust REST API built with **Python** and the **Flask** web framework. It handles our full authentication system, data processing, and all interactions with our AI and matching services.
* **AI & Matching:** The core intelligence is powered by the **Azure OpenAI Service** for strategic analysis and our custom-built **Vector Engine** and **Advanced Matcher** for intelligent partner discovery.
* **Database:** For the MVP, we used a **JSON** flat-file database that includes tables for users, producers, and consumers.
* **Version Control:** Git & GitHub.

## 🏃 Challenges We Ran Into

* **Complex AI Integration:** Engineering the AI to act as a reliable "consultant" that consistently returns structured JSON required significant prompt engineering and building a resilient backend that could gracefully handle intermittent API failures.
* **Advanced Architecture:** Integrating a full authentication system with a vector-based matching engine and a multi-page React frontend was a major architectural challenge that pushed us to learn best practices for state management and API design under a tight deadline.

## 🚀 What's Next for CarbonFlow

Our vision is to scale CarbonFlow into a global, real-time utility for the sustainability sector. Our next steps are:
1.  **Migrate to a Relational Database:** Move from our JSON MVP to a scalable database like PostgreSQL.
2.  **Integrate Live Data Feeds:** Connect to real-time APIs from sources like the EPA to create a dynamic, always-up-to-date marketplace.
3.  **Implement Logistics & Route Optimization:** Build out our planned module to calculate optimal delivery routes and real-world transportation costs, adding another layer of value for our users.
