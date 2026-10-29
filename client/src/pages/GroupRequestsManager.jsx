import React from 'react'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useUser } from '@clerk/clerk-react'
import { useSearchParams } from 'react-router-dom'

const GroupRequestsManager = ({ ownerId }) => {
    const { user } = useUser();
    const [groups, setGroups] = useState([]);
    const [searchParams] = useSearchParams();
    const selectedGroupId = searchParams.get('groupId');
    const currentOwnerId = ownerId || user?.id;

    useEffect(() => {
        const fetchOwnedGroups = async () => {
            if (!currentOwnerId) return;
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_BASEURL}/api/group/owned/${currentOwnerId}`
                );
                const payload = Array.isArray(res.data) ? res.data : res.data.groups || [];
                setGroups(payload);
            } catch (err) {
                console.log("error ", err);
                setGroups([]);
            }
        };

        fetchOwnedGroups();
    }, [currentOwnerId]);

    const acceptRequest = async (groupId, userId) => {
        try {
            await axios.post(
                `${import.meta.env.VITE_BASEURL}/api/group/${groupId}/accept`,
                { userId }
            )
            alert("تم قبول العضو بنجاح")
            setGroups((prev) =>
                prev.map((g) =>
                    g._id === groupId
                        ? { ...g, members: g.members.map((m) => m.userId === userId ? { ...m, status: 'accepted' } : m) }
                        : g
                )
            )
        } catch (err) {
            console.log(err)
        }
    }

    const visibleGroups = selectedGroupId
        ? groups.filter((group) => String(group._id) === selectedGroupId)
        : groups;

    return (
        <div className='min-h-screen bg-gray-900 p-3 text-white sm:p-4'>
            <h2 className="text-2xl font-bold mb-4">
                {selectedGroupId ? 'طلبات الانضمام للمجموعة' : 'طلبات الانضمام لمجموعات'}
            </h2>
            {visibleGroups.length === 0 && (
                <p>{selectedGroupId ? 'المجموعة غير موجودة ضمن مجموعاتك' : 'لا توجد مجموعات ملكك'}</p>
            )}
            {visibleGroups.map((g) => (
                <div key={g._id} className="mb-6 bg-gray-800 p-4 rounded-xl">
                    <h3 className="font-bold mb-2">{g.name}</h3>
                    <RequestsList group={g} acceptRequest={acceptRequest} />
                </div>
            ))}
        </div>
    )
}

function RequestsList ({ group, acceptRequest }) {
    const requests = group.members.filter((m) => m.status === 'pending')
    if (!requests || requests.length === 0)
        return <p className='text-sm opacity-70'>لا توجد طلبات حاليا</p>

    return (
        <ul className="space-y-2">
            {requests.map((r) => (
                <li key={r.userId} className='flex justify-between items-center p-2 bg-gray-700 rounded-xl'>
                    <span>{r.profile?.full_name || r.profile?.username || 'مستخدم غير معروف'}</span>
                    <button onClick={() => acceptRequest(group._id, r.userId)}
                        className='px-3 py-1 bg-green-600 rounded-xl hover:opacity-80'>
                        قبول
                    </button>
                </li>
            ))}
        </ul>
    )
}

export default GroupRequestsManager
