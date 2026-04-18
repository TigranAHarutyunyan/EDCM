import Navbar from './Navbar';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children }) => {
    const { isDarkMode } = useTheme();
    
    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-50'}`}>
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;
