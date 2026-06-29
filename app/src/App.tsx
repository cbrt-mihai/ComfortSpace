import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LibraryPage } from "./pages/Library";
import { ReaderPage } from "./pages/Reader";
import { SeriesPage } from "./pages/Series";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/series/:slug" element={<SeriesPage />} />
        <Route path="/series/:slug/v/:volume" element={<ReaderPage />} />
      </Routes>
    </BrowserRouter>
  );
}
