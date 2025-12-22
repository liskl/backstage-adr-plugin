import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AdrDashboardPage } from './AdrDashboard';
import { AdrDetailPage } from './AdrDetail';

/**
 * Main router for the ADR plugin
 */
export const AdrRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<AdrDashboardPage />} />
      <Route path="/:id" element={<AdrDetailPage />} />
    </Routes>
  );
};
