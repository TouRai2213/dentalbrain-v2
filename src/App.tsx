import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { PatientDetail } from './pages/PatientDetail';
import { AlertDetection } from './pages/AlertDetection';
import { ImageProvider } from './context/ImageContext';
import { Appointments } from './pages/Appointments';

function App() {

  return (
    <BrowserRouter>
      <ImageProvider>
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/patients/:id"
            element={
              <Layout>
                <PatientDetail />
              </Layout>
            }
          />
          <Route
            path="/appointments"
            element={
              <Layout>
                <Appointments />
              </Layout>
            }
          />
          <Route path="/alert-detection" element={<AlertDetection />} />
        </Routes>
      </ImageProvider>
    </BrowserRouter>
  );
}

export default App;