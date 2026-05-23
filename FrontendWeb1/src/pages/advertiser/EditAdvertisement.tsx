import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import { fetchAdvertisementById, updateAdvertisement } from "../../services/AdvertisementsList";

interface AdData {
  id: number;
  name: string;
  videoUrl: string;      // just the filename, e.g., "ad1.mp4"
  thumbnailUrl?: string; // just the filename, e.g., "thumb1.jpg"
}

const EditAdvertisement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    videoFile: null as File | null,
    thumbnailFile: null as File | null,
    videoName: "",
    thumbnailName: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchAd = async () => {
      setLoading(true);
      try {
        const data = await fetchAdvertisementById(Number(id));
        setFormData({
          name: data.name,
          videoFile: null,
          thumbnailFile: null,
          videoName: data.videoUrl || "",
          thumbnailName: data.thumbnailUrl || "",
        });
      } catch (err) {
        console.error(err);
        alert("Failed to load advertisement");
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

 const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]; // safe access
  if (file) {
    setFormData(prev => ({
      ...prev,
      videoFile: file,
      videoName: file.name
    }));
  }
};

const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]; // safe access
  if (file) {
    setFormData(prev => ({
      ...prev,
      thumbnailFile: file,
      thumbnailName: file.name
    }));
  }
};

 const handleSubmit = async () => {
  if (!formData.name) {
    alert("Please provide a name.");
    return;
  }

  if (!id) {
    alert("Invalid advertisement ID");
    return;
  }

  setLoading(true);
  try {
    await updateAdvertisement(Number(id), {
      name: formData.name,
      thumbnailUrl: formData.thumbnailName,
      // videoUrl is not part of update payload as defined, backend may ignore
    });
  } catch (err) {
    console.error(err);
    alert("Error updating advertisement.");
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Edit Advertisement | Circuit Crew" description="Edit your ad campaign" />
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-10 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Advertisement</h1>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            {/* Video */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Video</label>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              {formData.videoName && (
                <p className="mt-2 text-sm text-gray-600">
                  Current: <span className="text-blue-600">{`/videos/${formData.videoName}`}</span>
                </p>
              )}
            </div>

            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Thumbnail</label>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
              {formData.thumbnailName && (
                <p className="mt-2 text-sm text-gray-600">
                  Current: <span className="text-blue-600">{`/images/${formData.thumbnailName}`}</span>
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => navigate(-1)}
                className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditAdvertisement;