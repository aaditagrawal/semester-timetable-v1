"use client";

import { classNames } from "@/ui.stylex";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Course } from "@/lib/timetable-data";
import { MapPinIcon, UserIcon, BookIcon, ClockIcon } from "@phosphor-icons/react";

interface CourseDetailProps {
  course: Course;
  timeSlot?: string;
  isActive?: boolean;
  isPassed?: boolean;
  children: React.ReactNode;
}

export function CourseDetail({
  course,
  timeSlot,
  isActive,
  isPassed,
  children,
}: CourseDetailProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="center" className={classNames.courseDetail297} sideOffset={8}>
        <DropdownMenuLabel className={classNames.dayView210}>
          <span className={classNames.courseDetail298}>{course.abbreviation}</span>
          <div className={classNames.courseDetail299}>
            {isActive && (
              <Badge variant="default" className={classNames.courseDetail300}>
                LIVE
              </Badge>
            )}
            {isPassed && (
              <Badge variant="secondary" className={classNames.courseDetail300}>
                DONE
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className={classNames.courseDetail301}>
          {/* Course name */}
          <div className={classNames.courseDetail302}>
            <BookIcon className={classNames.courseDetail303} />
            <div>
              <p className={classNames.courseDetail304}>{course.name}</p>
              <p className={classNames.setupModal60}>{course.code}</p>
            </div>
          </div>

          {/* Room */}
          {course.room && (
            <div className={classNames.home18}>
              <MapPinIcon className={classNames.courseDetail305} />
              <p className={classNames.home16}>{course.room}</p>
            </div>
          )}

          {/* Time slot */}
          {timeSlot && (
            <div className={classNames.home18}>
              <ClockIcon className={classNames.courseDetail305} />
              <p className={classNames.home16}>{timeSlot}</p>
            </div>
          )}

          {/* Faculty */}
          <div className={classNames.courseDetail302}>
            <UserIcon className={classNames.courseDetail303} />
            <div className={classNames.dayView222}>
              {course.faculty.map((f, idx) => (
                <p key={idx} className={classNames.home16}>
                  {f.name}
                </p>
              ))}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
