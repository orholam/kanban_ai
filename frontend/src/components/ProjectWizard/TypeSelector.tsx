
export default function TypeSelector({ type, updateType, types }: { type: string, updateType: (type: string) => void, types: any[] }) {
    // This is a wizard step that allows the user to select the type of project they want to create.
    // For example, mobile app, blog, or even something like an event they want to plan.
    // This should be only a selector, but should be horizontal scrolling where each option is a tile.
    // Icons are from Lucide


    const handleTypeSelect = (typeName: string) => {
        updateType(typeName);
    };

    return (
        <div className="flex flex-row gap-3 overflow-x-auto p-4">
            {types.map((typeOption) => (
                <div 
                    key={typeOption.id} 
                    className={`group relative flex flex-row items-center gap-2 p-4 rounded-lg cursor-pointer transition-all duration-300 min-w-[100px] ${
                        type === typeOption.name 
                            ? 'bg-gradient-to-r from-indigo-100 to-blue-100 shadow-md shadow-indigo-200/40' 
                            : 'bg-white/80 hover:bg-white hover:shadow-sm hover:shadow-indigo-100/30'
                    }`}
                    onClick={() => handleTypeSelect(typeOption.name)}
                >
                    <div className={`p-2 rounded-lg transition-all duration-300 ${
                        type === typeOption.name 
                            ? 'text-indigo-600' 
                            : 'text-gray-500 group-hover:text-indigo-500'
                    }`}>
                        {typeOption.icon}
                    </div>
                    <span className={`font-medium text-xs text-center transition-colors duration-300 ${
                        type === typeOption.name 
                            ? 'text-indigo-900' 
                            : 'text-gray-600 group-hover:text-indigo-700'
                    }`}>
                        {typeOption.name}
                    </span>
                    
                    {/* Glowing effect for selected state */}
                    {type === typeOption.name && (
                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-400/10 to-purple-400/10 animate-pulse" />
                    )}
                </div>
            ))}
        </div>
    );
}