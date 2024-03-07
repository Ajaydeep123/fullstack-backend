# True Social : A video Streaming platform for your community.
#### Data Model : [Link](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)
## Overview
This repository contains the backend codebase for a full-featured video streaming platform. It is built using MongoDB for database management and Express.js for handling server-side logic. The backend supports user authentication, video management, likes, subscriptions, and social media interactions.

## Features
- User authentication and authorization with JWT and custom session-based authentication.
- Password encryption using bcrypt.
- RESTful API endpoints for users, videos, likes, subscriptions, and tweets.
- Mongoose models for robust data structuring and validation.
- Optimized MongoDB aggregation pipelines for efficient data retrieval and manipulation.
- Scalable architecture to handle high traffic and data volume.

#### MongoDB Aggregation Pipelines
We extensively utilize MongoDB aggregation pipelines to perform complex data transformations and aggregations. This allows us to efficiently retrieve and process data, reducing the load on the database and improving performance.

#### Custom Session-Based Authentication
In addition to JWT authentication, we have implemented a custom session-based authentication mechanism. This provides an alternative and more granular approach to user authentication, allowing for better control over user sessions and security.

## Getting Started
To get started with this project, clone the repository and install the dependencies:

```bash
git clone https://github.com/Ajaydeep123/TrueSocial.git

npm install
```
- Make sure you have MongoDB installed and running on your local machine, or configure an external MongoDB service in the `db` script.

To run the application:

```bash 
npm run dev
```


## Contribution Guidelines
We welcome contributions from the community. If you wish to contribute to the project, please follow these guidelines:

1. Fork the repository and create your branch.
2. Write clear and concise commit messages.
3. Ensure that your code adheres to the existing code format standards.
4. Write tests for your new features or fixes.

## Future Prospects
- **Video Analytics**: Implement analytics to provide insights on video performance, viewer engagement, and demographics.
- **Live Streaming**: Integrate live streaming capabilities to allow users to broadcast in real-time.
- **Machine Learning**: Employ machine learning algorithms for better content recommendation and user experience personalization.
- **Internationalization**: Prepare the platform for international use with multi-language support and region-specific content management.


Thank you for your interest in contributing to our platform. Together, we can create a powerful and engaging video streaming service.



