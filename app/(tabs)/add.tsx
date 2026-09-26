import { useState } from 'react';
import { router } from 'expo-router';
import AccountGate from '../../src/components/AccountGate';
import TripForm from '../../src/components/TripForm';
import { useAuth } from '../../src/contexts/AuthContext';
export default function Add() {
  const [revision,setRevision]=useState(0); const {session}=useAuth();
  return <AccountGate><TripForm key={`${session?.email}-${revision}`} onSaved={id=>{setRevision(v=>v+1);router.push({pathname:'/trip/[id]',params:{id}});}} /></AccountGate>;
}
