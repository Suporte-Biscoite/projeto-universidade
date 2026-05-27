// src/hooks/useCourses.js
// Hook que gerencia cursos, módulos e aulas via API
// Substitui as funções do ProfileContext: addCourse, updateCourse, deleteCourse,
// addModule, updateModule, deleteModule, addLesson, deleteLesson

import { useState, useEffect, useCallback } from 'react';

function getToken() {
  return sessionStorage.getItem('biscoite_access_token')
      || localStorage.getItem('biscoite_access_token')
      || null;
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function useCourses() {
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // ── Busca todos os cursos publicados ─────────────────────────────────────
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/courses', { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // ── Busca curso específico com módulos e aulas ────────────────────────────
  const fetchCourse = useCallback(async (id) => {
    const res = await fetch(`/api/courses?id=${id}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Curso não encontrado');
    return res.json();
  }, []);

  // ── CRUD Cursos ───────────────────────────────────────────────────────────
  const addCourse = useCallback(async (data) => {
    const res = await fetch('/api/courses', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        title:         data.title,
        description:   data.description,
        category:      data.category,
        level:         data.level,
        format:        data.format,
        duration:      data.duration,
        thumbnail_url: data.thumbnail,
        vimeo_id:      data.vimeoId || null,
        published:     data.published || false,
      }),
    });
    const course = await res.json();
    if (!res.ok) throw new Error(course.error);
    setCourses(prev => [course, ...prev]);
    return course.id;
  }, []);

  const updateCourse = useCallback(async (id, data) => {
    const res = await fetch(`/api/courses?id=${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        title:         data.title,
        description:   data.description,
        category:      data.category,
        level:         data.level,
        format:        data.format,
        duration:      data.duration,
        thumbnail_url: data.thumbnail,
        vimeo_id:      data.vimeoId,
        published:     data.published,
      }),
    });
    const course = await res.json();
    if (!res.ok) throw new Error(course.error);
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...course } : c));
    return course;
  }, []);

  const deleteCourse = useCallback(async (id) => {
    const res = await fetch(`/api/courses?id=${id}`, {
      method: 'DELETE', headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Erro ao deletar curso');
    setCourses(prev => prev.filter(c => c.id !== id));
  }, []);

  // ── CRUD Módulos ──────────────────────────────────────────────────────────
  const addModule = useCallback(async (courseId, title) => {
    const res = await fetch('/api/modules', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ courseId, title }),
    });
    const mod = await res.json();
    if (!res.ok) throw new Error(mod.error);
    return mod;
  }, []);

  const updateModule = useCallback(async (id, title) => {
    const res = await fetch(`/api/modules?id=${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ title }),
    });
    const mod = await res.json();
    if (!res.ok) throw new Error(mod.error);
    return mod;
  }, []);

  const deleteModule = useCallback(async (id) => {
    await fetch(`/api/modules?id=${id}`, { method: 'DELETE', headers: authHeaders() });
  }, []);

  // ── CRUD Aulas ────────────────────────────────────────────────────────────
  const addLesson = useCallback(async (moduleId, lessonData) => {
    const res = await fetch('/api/lessons', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        moduleId,
        title:    lessonData.title,
        duration: lessonData.duration,
        vimeo_id: lessonData.vimeoId || null,
        type:     lessonData.type || 'video',
      }),
    });
    const lesson = await res.json();
    if (!res.ok) throw new Error(lesson.error);
    return lesson;
  }, []);

  const updateLesson = useCallback(async (id, data) => {
    const res = await fetch(`/api/lessons?id=${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        title:    data.title,
        duration: data.duration,
        vimeo_id: data.vimeoId,
        locked:   data.locked,
      }),
    });
    const lesson = await res.json();
    if (!res.ok) throw new Error(lesson.error);
    return lesson;
  }, []);

  const deleteLesson = useCallback(async (moduleId, lessonId) => {
    await fetch(`/api/lessons?id=${lessonId}`, { method: 'DELETE', headers: authHeaders() });
  }, []);

  return {
    courses, loading, error,
    fetchCourses, fetchCourse,
    addCourse, updateCourse, deleteCourse,
    addModule, updateModule, deleteModule,
    addLesson, updateLesson, deleteLesson,
  };
}
