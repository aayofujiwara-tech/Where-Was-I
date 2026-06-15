"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginScreen } from "@/components/LoginScreen";
import { TagInput } from "@/components/TagInput";
import { getWorks, updateWork } from "@/lib/firestore";
import type { Work } from "@/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function EditWorkPage() {
  const { user, loading } = useAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [work, setWork] = useState<Work | null>(null);
  const [fetching, setFetching] = useState(true);
  const [title, setTitle] = useState("");
  const [piccomaUrl, setPiccomaUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    getWorks(user.uid).then((works) => {
      const found = works.find((w) => w.id === id) ?? null;
      setWork(found);
      if (found) {
        setTitle(found.title);
        setPiccomaUrl(found.piccoma_url);
        setCoverUrl(found.cover_image_url);
        setTags(found.genre_tags);
      }
    }).finally(() => setFetching(false));
  }, [user, id]);

  const isValidUrl = (url: string) =>
    url === "" || url.startsWith("https://") || url.startsWith("http://");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!isValidUrl(piccomaUrl.trim())) {
      setError("ピッコマURLはhttps://で始まるURLを入力してください。");
      return;
    }
    if (!isValidUrl(coverUrl.trim())) {
      setError("サムネイルURLはhttps://で始まるURLを入力してください。");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await updateWork(user.uid, id, {
        title: title.trim(),
        piccoma_url: piccomaUrl.trim(),
        cover_image_url: coverUrl.trim(),
        genre_tags: tags,
      });
      router.push(`/works/${id}`);
    } catch (err) {
      setError("保存に失敗しました。もう一度お試しください。");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center text-gray-400">読み込み中...</div>;
  if (!user) return <LoginScreen />;
  if (!work) return <div className="min-h-screen flex items-center justify-center text-gray-400">作品が見つかりません</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href={`/works/${id}`} className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
        <h1 className="text-lg font-bold text-gray-900">作品を編集</h1>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm space-y-5">

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              作品名 <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ジャンルタグ
              <span className="text-xs text-gray-400 font-normal ml-2">入力してEnterで追加</span>
            </label>
            <TagInput tags={tags} onChange={setTags} userId={user.uid} />
          </div>

          <div>
            <label htmlFor="piccoma-url" className="block text-sm font-medium text-gray-700 mb-1">
              ピッコマURL
            </label>
            <input
              id="piccoma-url"
              type="url"
              value={piccomaUrl}
              onChange={(e) => setPiccomaUrl(e.target.value)}
              placeholder="https://piccoma.com/web/product/..."
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label htmlFor="cover-url" className="block text-sm font-medium text-gray-700 mb-1">
              サムネイル画像URL
              <span className="text-xs text-gray-400 font-normal ml-2">任意</span>
            </label>
            <input
              id="cover-url"
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "保存中..." : "変更を保存する"}
          </button>
        </form>
      </main>
    </div>
  );
}
