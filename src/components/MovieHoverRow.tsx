import React from "react";

interface MovieHoverRowProps {
  children: React.ReactNode;
  className?: string;
}

const MovieHoverRow = ({ children, className = "" }: MovieHoverRowProps) => {
  return (
    <div className={`movie-hover-container py-2 ${className}`}>{children}</div>
  );
};

export default MovieHoverRow;
