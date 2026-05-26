export default function CategoryCard({ name, icon: Icon, color }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer text-center flex flex-col items-center">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
        <Icon className="text-[#334155]" size={22} />
      </div>
      <h3 className="font-bold text-[#001A26] text-sm">{name}</h3>
    </div>
  );
}