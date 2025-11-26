import { useMemo, useState, useCallback, useEffect } from "react";
import { getProgress, setProgress } from "../utils/hikmahStorage";
import { HikmahTree } from "../utils/api";
import { useFocusEffect } from "expo-router";

/**
 * Track progress for a single tree
 */
export function useHikmahProgress(tree: Partial<HikmahTree> | null) {
  const treeId = tree?.id || "";
  const [completed, setCompleted] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadProgress = useCallback(() => {
    if (!treeId) {
      setCompleted([]);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    let mounted = true;
    getProgress(treeId).then((data) => {
      if (mounted) {
        setCompleted(data.completedLessonIds || []);
        setIsLoaded(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [treeId]);

  // 🔁 Re-hydrate from storage whenever the treeId changes
  useEffect(() => {
    return loadProgress();
  }, [loadProgress]);

  // 🔄 Reload progress when the screen comes into focus (e.g. returning from lesson)
  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  // 🧹 Clean up stale lesson IDs (run once per tree load after hydration)
  useEffect(() => {
    if (!treeId || !tree?.lessons?.length || !isLoaded) return;
    
    const validIds = new Set(tree.lessons.map((l) => String(l.id)));
    
    // Check if we have any stale IDs in memory
    const currentCompleted = completed;
    const cleaned = currentCompleted.filter((id) => validIds.has(id));
    
    if (cleaned.length !== currentCompleted.length) {
      // Stale IDs detected, clean them up
      setProgress(treeId, cleaned);
      setCompleted(cleaned);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeId, tree?.lessons?.length, isLoaded]); 

  const total = tree?.lessons?.length || 0;

  // Filter completed to only include lessons that actually exist in tree.lessons
  const validLessonIds = useMemo(
    () => new Set((tree?.lessons || []).map((l) => String(l.id))),
    [tree?.lessons]
  );
  
  const validCompleted = useMemo(
    () => completed.filter((id) => validLessonIds.has(id)),
    [completed, validLessonIds]
  );

  const completedCount = validCompleted.length;
  const percent = total ? Math.round((completedCount / total) * 100) : 0;

  const isCompleted = useCallback(
    (lessonId: string | number) => completed.includes(String(lessonId)),
    [completed]
  );

  const toggleComplete = useCallback(
    (lessonId: string | number) => {
      const idStr = String(lessonId);
      setCompleted((prev) => {
        const next = prev.includes(idStr)
          ? prev.filter((id) => id !== idStr)
          : [...prev, idStr];
        if (treeId) setProgress(treeId, next);
        return next;
      });
    },
    [treeId]
  );

  const nextLesson = useCallback(() => {
    if (!tree?.lessons?.length) return null;
    // Assume lessons are already sorted by order if they come from API
    // If needed, we can re-sort here if order is available on the lesson objects in the tree
    // But the tree object from API usually has lessons sorted or we sort them in the fetcher
    const lessons = tree.lessons; 
    const firstIncomplete = lessons.find((l) => !validCompleted.includes(String(l.id)));
    return firstIncomplete || lessons[lessons.length - 1];
  }, [tree, validCompleted]);

  return {
    completed,
    completedCount,
    total,
    percent,
    isCompleted,
    toggleComplete,
    nextLesson,
    isLoaded,
  };
}
