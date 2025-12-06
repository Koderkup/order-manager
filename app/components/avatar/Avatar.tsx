"use client";
import React from "react";
import { FaRegCircleUser } from "react-icons/fa6";

interface AvatarProps {
  isAuthenticated: boolean;
  name?: string; // имя пользователя для инициалов
  avatarUrl?: string; // ссылка на картинку
}

const Avatar: React.FC<AvatarProps> = ({
  isAuthenticated,
  name,
  avatarUrl,
}) => {
  // Функция для получения инициалов
  const getInitials = (fullName?: string) => {
    if (!fullName) return "";
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (!isAuthenticated) {
    // Не зарегистрирован → иконка
    return (
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700">
        <FaRegCircleUser className="text-gray-600 dark:text-gray-300 text-3xl" />
      </div>
    );
  }

  if (avatarUrl) {
    // Зарегистрирован и есть картинка
    return (
      <img
        src={avatarUrl}
        alt={name || "User Avatar"}
        className="w-12 h-12 rounded-full object-cover border border-gray-300 dark:border-gray-600"
      />
    );
  }

  // Зарегистрирован, но картинки нет → инициалы
  return (
    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 text-white font-bold">
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
