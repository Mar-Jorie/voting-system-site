# Simple Voting System

A modern, responsive voting system built with React, Vite, and Tailwind CSS v4. This system allows admins to manage candidates and enables public users to vote for their preferred candidates in different categories.

## Features

### 🗳️ Voting System
- **Category-based voting**: Users can vote for one candidate from each category (male/female)
- **Email validation**: One vote per email address per category
- **Real-time vote counting**: Live updates of voting results
- **Secure voting**: Email-based validation prevents duplicate votes

### 👨‍💼 Admin Panel
- **Candidate management**: Add, edit, and delete candidates
- **Image upload**: Support for candidate photos
- **Vote analytics**: View voting statistics and results
- **User management**: Admin authentication system

### 🎨 User Interface
- **Responsive design**: Mobile-first approach with touch interactions
- **Modern UI**: Clean, professional interface using Tailwind CSS v4
- **Progressive Web App**: PWA capabilities for offline access
- **Accessibility**: WCAG compliant design

### 🔧 Technical Features
- **React 19**: Latest React features and performance improvements
- **Vite**: Fast development and build tooling
- **Tailwind CSS v4**: Modern utility-first CSS framework
- **PWA Support**: Service worker and offline capabilities
- **TypeScript Ready**: Full TypeScript support
- **ESLint**: Code quality and consistency

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd voting-system
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test:e2e` - Run end-to-end tests

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (Header, Sidebar, etc.)
│   ├── Button.jsx      # Button component
│   ├── InputFactory.jsx # Dynamic input component
│   ├── SelectInput.jsx # Select dropdown component
│   └── ...
├── pages/              # Page components
│   ├── LandingPage.jsx # Public landing page
│   ├── SignInPage.jsx  # Authentication pages
│   ├── MainPage.jsx    # Main application page
│   └── ...
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── usecases/           # Business logic and API calls
└── App.jsx             # Main application component
```

## Usage

### For Public Users
1. Visit the landing page
2. Click "Start Voting" to access the voting interface
3. Select one candidate from each category
4. Enter your name and email address
5. Submit your vote

### For Administrators
1. Sign in with admin credentials (admin@voting.com / admin123)
2. Access the admin panel to manage candidates
3. View voting results and analytics
4. Add, edit, or remove candidates

## Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_APP_ID=your-app-id
VITE_MASTER_KEY=your-master-key
```

### Color Palette
The system uses a custom color palette based on `#154D71`:
- Primary colors: Various shades of blue
- Semantic colors: Success, warning, error, info
- Gray scale: For text and backgrounds

## Testing

The project includes end-to-end tests using Puppeteer and Jest:

```bash
npm run test:e2e
```

Tests cover:
- Landing page loading
- Navigation between pages
- Responsive design
- User interactions

## Deployment

### Production Build
```bash
npm run build
```

The build creates optimized files in the `dist/` directory, including:
- Minified JavaScript and CSS
- Service worker for PWA functionality
- Optimized assets

### Deployment Options
- **Static hosting**: Deploy the `dist/` folder to any static hosting service
- **CDN**: Use a CDN for global distribution
- **Docker**: Containerize the application for easy deployment

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.