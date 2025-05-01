import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Homepage from './page/user/homepage/homepage'
import SignIn from './page/user/signin/signin'
import Admin from './page/admin/dashboard/dashboard'
import Certificate from './page/admin/certificate/certificate'
import CertificateDetails from './page/admin/certificateDetails/certificateDetails'
import Course from './page/admin/course/course'
import CreateCertificate from './page/admin/createCertificate/createCertificate'
import EditCertificate from './page/admin/editCertificate/editCertificate'
import Quiz from './page/admin/quiz/quiz'
import ParkGuideDashboard from './page/parkguide/dashboard/dashboard'
import ParkGuideCertifications from './page/parkguide/certificate/certificate'
import AdminApplication from './page/admin/application/application'
import ProgressDetails from './page/parkguide/progressDetails/progressDetails'
import TopicDetails from './page/parkguide/topicDetails/topicDetails'
import ParkGuideQuiz from './page/parkguide/quiz/quiz'
import AdminUsers from './page/admin/users/users'
import AdminNotifications from './page/admin/notifications/notifications'
import ParkGuideNotifications from './page/parkguide/notifications/notifications'
import SensorData from './page/admin/sensorData/sensorData'
import Identification from './page/parkguide/identification/identification'


function App() {
  return (
    <Router>
      <Routes>
        {/* Default route redirect to homepage */}
        <Route path="/" element={<Homepage />} />
        <Route path="/signin" element={<SignIn />} />
        
        {/* More routes can be added in the future */}
        {/* <Route path="/about" element={<About />} /> */}
        {/* <Route path="/features" element={<Features />} /> */}
        {/* <Route path="/testimonials" element={<Testimonials />} /> */}
        {/* <Route path="/contact" element={<Contact />} /> */}
        
        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<Admin />} />
        <Route path="/admin/certificate" element={<Certificate />} />
        <Route path="/admin/certificate/create" element={<CreateCertificate />} />
        <Route path="/admin/certificate/edit/:id" element={<EditCertificate />} />
        <Route path="/admin/certificate/:id" element={<CertificateDetails />} />
        <Route path="/admin/certificate/:id/course" element={<Course />} />
        <Route path="/admin/certificate/:id/course/quiz" element={<Quiz />} />
        <Route path="/admin/quiz/:topicId" element={<Quiz />} />
        <Route path="/admin/application" element={<AdminApplication />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
        <Route path="/admin/sensor-data" element={<SensorData />} />
        {/* Park guide routes */}
        <Route path="/parkguide/dashboard" element={<ParkGuideDashboard />} />
        <Route path="/parkguide/certifications" element={<ParkGuideCertifications />} />
        <Route path="/parkguide/progress-details/:id" element={<ProgressDetails />} />
        <Route path="/parkguide/topic/:id" element={<TopicDetails />} />
        <Route path="/parkguide/quiz/:id" element={<ParkGuideQuiz />} />
        <Route path="/parkguide/notifications" element={<ParkGuideNotifications />} />
        <Route path="/parkguide/identification" element={<Identification />} />
        {/* <Route path="/parkguide/*" element={<ParkGuideRoutes />} /> */}
        
        {/* User authentication routes */}
        {/* <Route path="/signin" element={<SignIn />} /> */}
        {/* <Route path="/signup" element={<SignUp />} /> */}
        
        {/* 404 page - catch all unmatched routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}

export default App
