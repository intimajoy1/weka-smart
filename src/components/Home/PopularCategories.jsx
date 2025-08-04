import React from "react";
import {
  MdHotel,
  MdRestaurant,
  MdEvent,
  MdSpa,
  MdOutlineSupportAgent,
  MdCleaningServices,
  MdFlightTakeoff,
  MdOutlineEngineering,
} from "react-icons/md";

const PopularCategories = () => {
  const categories = [
    {
      id: 1,
      title: "Hotel & Lodging",
      subTitle: "320 Open Positions",
      icon: <MdHotel />,
    },
    {
      id: 2,
      title: "Food & Beverage",
      subTitle: "540 Open Positions",
      icon: <MdRestaurant />,
    },
    {
      id: 3,
      title: "Events & Conferences",
      subTitle: "180 Open Positions",
      icon: <MdEvent />,
    },
    {
      id: 4,
      title: "Spa & Wellness",
      subTitle: "75 Open Positions",
      icon: <MdSpa />,
    },
    {
      id: 5,
      title: "Customer Service",
      subTitle: "410 Open Positions",
      icon: <MdOutlineSupportAgent />,
    },
    {
      id: 6,
      title: "Housekeeping",
      subTitle: "220 Open Positions",
      icon: <MdCleaningServices />,
    },
    {
      id: 7,
      title: "Travel & Tourism",
      subTitle: "350 Open Positions",
      icon: <MdFlightTakeoff />,
    },
    {
      id: 8,
      title: "Maintenance & Engineering",
      subTitle: "140 Open Positions",
      icon: <MdOutlineEngineering />,
    },
  ];

  return (
    <div className="categories">
      <h3>POPULAR CATEGORIES</h3>
      <div className="banner">
        {categories.map((element) => (
          <div className="card" key={element.id}>
            <div className="icon">{element.icon}</div>
            <div className="text">
              <p>{element.title}</p>
              <p>{element.subTitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularCategories;
