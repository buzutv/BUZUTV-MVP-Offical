
import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useAdminChannels } from '@/hooks/useAdminChannels';

interface ChannelSearchSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

const ChannelSearchSelect: React.FC<ChannelSearchSelectProps> = ({
  value,
  onValueChange,
  placeholder = "Search and select channel..."
}) => {
  const { channels } = useAdminChannels();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find the selected channel name
  const selectedChannelName = channels.find(channel => channel.id === value)?.name || '';

  useEffect(() => {
    setSelectedChannel(selectedChannelName);
  }, [selectedChannelName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (channel.description && channel.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleChannelSelect = (channelId: string, channelName: string) => {
    onValueChange(channelId);
    setSelectedChannel(channelName);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onValueChange('');
    setSelectedChannel('');
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white cursor-pointer hover:border-gray-500 transition-colors"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
      >
        <span className={selectedChannel ? 'text-white' : 'text-gray-400'}>
          {selectedChannel || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full mt-1 w-full z-50 rounded-md border border-gray-600 bg-gray-700 shadow-lg">
          <div className="p-2 border-b border-gray-600">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-600 border border-gray-500 rounded px-8 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {/* Clear option */}
            <div
              className="flex items-center px-3 py-2 text-sm text-gray-300 hover:bg-gray-600 cursor-pointer"
              onClick={handleClear}
            >
              <span>No channel</span>
            </div>

            {filteredChannels.length > 0 ? (
              filteredChannels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center px-3 py-2 text-sm text-white hover:bg-gray-600 cursor-pointer"
                  onClick={() => handleChannelSelect(channel.id, channel.name)}
                >
                  <div className="flex items-center flex-1">
                    {channel.logo_url && (
                      <img
                        src={channel.logo_url}
                        alt={channel.name}
                        className="w-6 h-6 rounded mr-3 object-cover"
                      />
                    )}
                    <div>
                      <div className="font-medium">{channel.name}</div>
                      {channel.description && (
                        <div className="text-xs text-gray-400">{channel.description}</div>
                      )}
                    </div>
                  </div>
                  {value === channel.id && (
                    <Check className="h-4 w-4 text-blue-400" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-400">
                No channels found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelSearchSelect;
